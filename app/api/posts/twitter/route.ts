import { getAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, mediaUrls, accountId } = await req.json();
  console.log(content, mediaUrls, accountId);

  const account = await db.connectedAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      provider: "TWITTER",
    },
  });

  if (!account || !account.accessToken || !account.accessTokenSecret) {
    throw new Error("Nie znaleziono konta Twitter lub brak tokenów dostępu");
  }

  const accessToken = decryptToken(account.accessToken);
  const accessTokenSecret = decryptToken(account.accessTokenSecret);

  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    throw new Error("Brak skonfigurowanych kluczy API Twittera");
  }

  if (!accessToken || !accessTokenSecret) {
    throw new Error("Brak tokenów dostępu do Twittera");
  }

  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`
        ).toString("base64")}`,
      },
    };

    const response = await fetch(
      "https://api.twitter.com/oauth2/token?grant_type=client_credentials",
      options
    );

    if (!response.ok) {
      throw new Error("Nie udało się uzyskać tokenu dostępu");
    }

    const data = await response.json();
    const bearerToken = data.access_token;
    const tokenType = data.token_type;

    if (!tokenType || tokenType !== "bearer") {
      throw new Error("Nieprawidłowy token dostępu");
    }

    const mediaIds: string[] = [];

    // Upload mediów
    if (mediaUrls && mediaUrls.length > 0) {
      for (let i = 0; i < Math.min(mediaUrls.length, 4); i++) {
        const mediaUrl = mediaUrls[i].url;
        let mediaData: Blob;
        let mediaType: string;

        if (mediaUrl.startsWith("data:")) {
          const base64Data = mediaUrl.split(",")[1];
          mediaType = mediaUrl.split(";")[0].split(":")[1];
          mediaData = new Blob([base64Data], { type: mediaType });
        } else {
          const response = await fetch(mediaUrl);
          mediaData = await response.blob();
          mediaType = mediaData.type;
        }

        // Step 1: INIT
        const initFormData = new FormData();
        initFormData.append("command", "INIT");
        initFormData.append("total_bytes", mediaData.size.toString());
        initFormData.append("media_type", mediaType);

        console.log("Inicjalizacja uploadu:", {
          size: mediaData.size,
          type: mediaType,
        });

        const initResponse = await fetch("https://api.x.com/2/media/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
          body: initFormData,
        });

        if (!initResponse.ok) {
          const errorData = await initResponse.text();
          console.error("Odpowiedź z API podczas inicjalizacji:", {
            status: initResponse.status,
            statusText: initResponse.statusText,
            headers: Object.fromEntries(initResponse.headers.entries()),
            body: errorData,
          });
          throw new Error(
            `Błąd podczas inicjalizacji uploadu mediów: ${initResponse.status} ${initResponse.statusText}`
          );
        }

        const initData = await initResponse.json();
        console.log("Odpowiedź z INIT:", initData);

        if (!initData.media_id_string) {
          throw new Error("Brak media_id_string w odpowiedzi z API");
        }

        const { media_id_string } = initData;

        // Step 2: APPEND - dzielenie na chunki
        const CHUNK_SIZE = 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(mediaData.size / CHUNK_SIZE);

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, mediaData.size);
          const chunk = mediaData.slice(start, end);

          const appendFormData = new FormData();
          appendFormData.append("command", "APPEND");
          appendFormData.append("media_id", media_id_string);
          appendFormData.append("segment_index", chunkIndex.toString());
          appendFormData.append("media", chunk);

          const appendResponse = await fetch(
            "https://api.x.com/2/media/upload",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
              body: appendFormData,
            }
          );

          if (!appendResponse.ok) {
            throw new Error(
              `Błąd podczas uploadu chunka ${chunkIndex + 1} z ${totalChunks}`
            );
          }
        }

        // Step 3: FINALIZE
        const finalizeFormData = new FormData();
        finalizeFormData.append("command", "FINALIZE");
        finalizeFormData.append("media_id", media_id_string);

        const finalizeResponse = await fetch(
          "https://api.x.com/2/media/upload",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
            body: finalizeFormData,
          }
        );

        if (!finalizeResponse.ok) {
          throw new Error("Błąd podczas finalizacji uploadu mediów");
        }

        const finalizeData = await finalizeResponse.json();

        // Step 4: STATUS (jeśli potrzebne)
        if (finalizeData.processing_info) {
          let processingComplete = false;
          while (!processingComplete) {
            await new Promise((resolve) =>
              setTimeout(
                resolve,
                finalizeData.processing_info.check_after_secs * 1000
              )
            );

            const statusResponse = await fetch(
              `https://api.x.com/2/media/upload?command=STATUS&media_id=${media_id_string}`,
              {
                headers: {
                  Authorization: `Bearer ${bearerToken}`,
                },
              }
            );

            const statusData = await statusResponse.json();
            if (statusData.processing_info.state === "succeeded") {
              processingComplete = true;
            } else if (statusData.processing_info.state === "failed") {
              throw new Error("Przetwarzanie mediów nie powiodło się");
            }
          }
        }

        mediaIds.push(media_id_string);
      }
    }

    // Tworzenie posta z mediami
    const postData = {
      text: content,
      media: { media_ids: mediaIds },
    };

    const postResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!postResponse.ok) {
      throw new Error("Nie udało się opublikować posta na Twitter");
    }

    const responseData = await postResponse.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error while posting to Twitter:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd w trakcie publikowania postu na Twitter.",
      },
      { status: 500 }
    );
  }
}
