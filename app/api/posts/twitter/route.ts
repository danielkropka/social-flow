import { getAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/utils";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, mediaUrls, accountId } = await req.json();

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
    const oauth = new OAuth({
      consumer: {
        key: process.env.TWITTER_API_KEY!,
        secret: process.env.TWITTER_API_SECRET!,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });

    const mediaIds: string[] = [];

    // Upload mediów
    if (mediaUrls && mediaUrls.length > 0) {
      for (let i = 0; i < Math.min(mediaUrls.length, 4); i++) {
        const mediaUrl = mediaUrls[i].url;
        let mediaData: Blob;

        if (mediaUrl.startsWith("data:")) {
          const base64Data = mediaUrl.split(",")[1];
          const originalMediaType = mediaUrl.split(";")[0].split(":")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          mediaData = new Blob([byteArray], { type: originalMediaType });
        } else if (mediaUrl.startsWith("blob:")) {
          // Dla URL-i blob, najpierw pobieramy dane
          const response = await fetch(mediaUrl);
          if (!response.ok) {
            throw new Error("Nie udało się pobrać pliku z URL blob");
          }
          mediaData = await response.blob();
        } else {
          throw new Error(
            "Nieobsługiwany format URL mediów. Wspierane formaty: data: i blob:"
          );
        }

        // Upload do S3
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          `http://${req.headers.get("host")}`;
        const uploadResponse = await fetch(`${baseUrl}/api/media/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-File-Name": `${Date.now()}-file`,
            "X-File-Type": mediaData.type,
          },
          body: mediaData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Błąd S3:", errorText);
          throw new Error("Błąd podczas uploadu do S3");
        }

        const { url: s3Url } = await uploadResponse.json();

        // Określ typ mediów dla Twittera
        const originalMediaType = mediaData.type;
        let mediaCategory = "tweet_image";
        if (originalMediaType.startsWith("video/")) {
          mediaCategory = "tweet_video";
        } else if (originalMediaType.startsWith("image/gif")) {
          mediaCategory = "tweet_gif";
        }

        console.log("S3 URL:", s3Url);

        // Pobierz plik z S3
        const s3Response = await fetch(s3Url);
        if (!s3Response.ok) {
          throw new Error(
            `Nie udało się pobrać pliku z S3: ${s3Response.statusText}`
          );
        }
        const s3Blob = await s3Response.blob();

        // Sprawdź rozmiar pliku
        if (s3Blob.size > 512 * 1024 * 1024) {
          // 512MB limit dla Twittera
          throw new Error("Plik jest zbyt duży. Maksymalny rozmiar to 512MB.");
        }

        const initForm = new FormData();
        initForm.append("command", "INIT");
        initForm.append("total_bytes", s3Blob.size.toString());
        initForm.append("media_type", originalMediaType);
        initForm.append("media_category", mediaCategory);

        // Step 1: INIT
        const initRequestData = {
          url: "https://upload.twitter.com/1.1/media/upload.json",
          method: "POST",
        };

        const initAuthorization = oauth.authorize(initRequestData, {
          key: accessToken,
          secret: accessTokenSecret,
        });

        try {
          const initResponse = await fetch(initRequestData.url, {
            method: initRequestData.method,
            headers: {
              Authorization: oauth.toHeader(initAuthorization).Authorization,
            },
            body: initForm,
          });

          if (!initResponse.ok) {
            const errorText = await initResponse.text();
            console.error("Błąd INIT:", errorText);
            throw new Error(
              `Błąd podczas inicjalizacji uploadu mediów: ${errorText}`
            );
          }

          const initData = await initResponse.json();
          const { media_id_string } = initData;

          // Step 2: APPEND - dzielenie na chunki
          const CHUNK_SIZE = 512 * 1024; // 512KB
          const totalChunks = Math.ceil(s3Blob.size / CHUNK_SIZE);

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            try {
              const start = chunkIndex * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, s3Blob.size);
              const chunk = s3Blob.slice(start, end);

              const appendForm = new FormData();
              appendForm.append("command", "APPEND");
              appendForm.append("media_id", media_id_string);
              appendForm.append("segment_index", chunkIndex.toString());
              appendForm.append("media", chunk);

              const appendRequestData = {
                url: "https://upload.twitter.com/1.1/media/upload.json",
                method: "POST",
              };

              const appendAuthorization = oauth.authorize(appendRequestData, {
                key: accessToken,
                secret: accessTokenSecret,
              });

              const appendResponse = await fetch(appendRequestData.url, {
                method: "POST",
                headers: {
                  Authorization:
                    oauth.toHeader(appendAuthorization).Authorization,
                },
                body: appendForm,
              });

              if (!appendResponse.ok) {
                const errorText = await appendResponse.text();
                console.error(
                  `Błąd podczas uploadu chunka ${chunkIndex + 1}:`,
                  errorText
                );
                throw new Error(
                  `Błąd podczas uploadu chunka ${
                    chunkIndex + 1
                  } z ${totalChunks}: ${errorText}`
                );
              }

              // Dodajemy małe opóźnienie między chunkami
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
              console.error(
                `Błąd podczas przetwarzania chunka ${chunkIndex + 1}:`,
                error
              );
              throw error;
            }
          }

          // Step 3: FINALIZE
          const finalizeForm = new FormData();
          finalizeForm.append("command", "FINALIZE");
          finalizeForm.append("media_id", media_id_string);

          const finalizeRequestData = {
            url: "https://upload.twitter.com/1.1/media/upload.json",
            method: "POST",
          };

          const finalizeAuthorization = oauth.authorize(finalizeRequestData, {
            key: accessToken,
            secret: accessTokenSecret,
          });

          const finalizeResponse = await fetch(finalizeRequestData.url, {
            method: "POST",
            headers: {
              Authorization: oauth.toHeader(finalizeAuthorization)
                .Authorization,
            },
            body: finalizeForm,
          });

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

              const statusRequestData = {
                url: `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${media_id_string}`,
                method: "GET",
              };

              const statusAuthorization = oauth.authorize(statusRequestData, {
                key: accessToken,
                secret: accessTokenSecret,
              });

              const statusResponse = await fetch(statusRequestData.url, {
                headers: {
                  Authorization:
                    oauth.toHeader(statusAuthorization).Authorization,
                },
              });

              if (!statusResponse.ok) {
                throw new Error("Błąd podczas sprawdzania statusu mediów");
              }

              const statusData = await statusResponse.json();

              if (statusData.processing_info.state === "succeeded") {
                processingComplete = true;
              } else if (statusData.processing_info.state === "failed") {
                throw new Error("Przetwarzanie mediów nie powiodło się");
              }
            }
          }

          mediaIds.push(media_id_string);
        } catch (error) {
          console.error("Error while processing INIT:", error);
          throw error;
        }
      }
    }

    // Tworzenie posta z mediami
    const postData = {
      text: content,
      media: { media_ids: mediaIds },
    };

    const postRequestData = {
      url: "https://api.twitter.com/2/tweets",
      method: "POST",
    };

    const postAuthorization = oauth.authorize(postRequestData, {
      key: accessToken,
      secret: accessTokenSecret,
    });

    const postResponse = await fetch(postRequestData.url, {
      method: "POST",
      headers: {
        Authorization: oauth.toHeader(postAuthorization).Authorization,
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
