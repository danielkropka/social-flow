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
    console.log("Tokeny dostępu:", {
      accessToken,
      accessTokenSecret,
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
    });

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

        // Upewnij się, że mamy poprawny typ mediów
        if (!mediaType) {
          mediaType = mediaData.type || "image/jpeg";
        }

        // Określ kategorię mediów na podstawie typu
        let mediaCategory = "tweet_image";
        if (mediaType.startsWith("video/")) {
          mediaCategory = "tweet_video";
        } else if (mediaType.startsWith("image/gif")) {
          mediaCategory = "tweet_gif";
        }

        console.log("Typ i kategoria mediów:", {
          mediaType,
          mediaCategory,
          size: mediaData.size,
        });

        const initForm = new FormData();
        initForm.append("command", "INIT");
        initForm.append("total_bytes", mediaData.size.toString());
        initForm.append("media_type", mediaCategory);

        // Step 1: INIT
        const initRequestData = {
          url: "https://upload.twitter.com/1.1/media/upload.json",
          method: "POST",
        };

        const initAuthorization = oauth.authorize(initRequestData, {
          key: accessToken,
          secret: accessTokenSecret,
        });

        console.log("Inicjalizacja uploadu:", {
          size: mediaData.size,
          type: mediaType,
          auth: initAuthorization,
          headers: oauth.toHeader(initAuthorization),
        });

        const initResponse = await fetch(initRequestData.url, {
          method: "POST",
          headers: {
            Authorization: oauth.toHeader(initAuthorization).Authorization,
          },
          body: initForm,
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

          // Konwertuj chunk na ArrayBuffer
          const chunkBuffer = await chunk.arrayBuffer();

          const appendForm = new FormData();
          appendForm.append("command", "APPEND");
          appendForm.append("media_id", media_id_string);
          appendForm.append("segment_index", chunkIndex.toString());
          appendForm.append("media_type", mediaCategory);
          appendForm.append(
            "media",
            new Blob([chunkBuffer], { type: mediaType })
          );

          const appendRequestData = {
            url: "https://upload.twitter.com/1.1/media/upload.json",
            method: "POST",
          };

          const appendAuthorization = oauth.authorize(appendRequestData, {
            key: accessToken,
            secret: accessTokenSecret,
          });

          console.log("Upload chunka:", {
            chunkIndex,
            totalChunks,
            chunkSize: chunk.size,
            mediaType,
            auth: appendAuthorization,
            headers: oauth.toHeader(appendAuthorization),
            formData: {
              command: "APPEND",
              media_id: media_id_string,
              segment_index: chunkIndex.toString(),
              media: `Blob(${chunk.size} bytes)`,
            },
          });

          const appendResponse = await fetch(appendRequestData.url, {
            method: "POST",
            headers: {
              Authorization: oauth.toHeader(appendAuthorization).Authorization,
            },
            body: appendForm,
          });

          if (!appendResponse.ok) {
            const errorData = await appendResponse.text();
            console.error("Odpowiedź z API podczas uploadu chunka:", {
              status: appendResponse.status,
              statusText: appendResponse.statusText,
              headers: Object.fromEntries(appendResponse.headers.entries()),
              body: errorData,
            });
            throw new Error(
              `Błąd podczas uploadu chunka ${chunkIndex + 1} z ${totalChunks}`
            );
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

        console.log("Finalizacja uploadu:", {
          media_id: media_id_string,
          auth: finalizeAuthorization,
          headers: oauth.toHeader(finalizeAuthorization),
          formData: {
            command: "FINALIZE",
            media_id: media_id_string,
          },
        });

        const finalizeResponse = await fetch(finalizeRequestData.url, {
          method: "POST",
          headers: {
            Authorization: oauth.toHeader(finalizeAuthorization).Authorization,
          },
          body: finalizeForm,
        });

        if (!finalizeResponse.ok) {
          const errorData = await finalizeResponse.text();
          console.error("Odpowiedź z API podczas finalizacji:", {
            status: finalizeResponse.status,
            statusText: finalizeResponse.statusText,
            headers: Object.fromEntries(finalizeResponse.headers.entries()),
            body: errorData,
          });
          throw new Error("Błąd podczas finalizacji uploadu mediów");
        }

        const finalizeData = await finalizeResponse.json();
        console.log("Odpowiedź z FINALIZE:", finalizeData);

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

            console.log("Sprawdzanie statusu:", {
              media_id: media_id_string,
              auth: statusAuthorization,
              headers: oauth.toHeader(statusAuthorization),
            });

            const statusResponse = await fetch(statusRequestData.url, {
              headers: {
                Authorization:
                  oauth.toHeader(statusAuthorization).Authorization,
              },
            });

            if (!statusResponse.ok) {
              const errorData = await statusResponse.text();
              console.error("Odpowiedź z API podczas sprawdzania statusu:", {
                status: statusResponse.status,
                statusText: statusResponse.statusText,
                headers: Object.fromEntries(statusResponse.headers.entries()),
                body: errorData,
              });
              throw new Error("Błąd podczas sprawdzania statusu mediów");
            }

            const statusData = await statusResponse.json();
            console.log("Odpowiedź ze STATUS:", statusData);

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
