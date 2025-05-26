import { getAuthSession } from "@/lib/config/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { decryptToken } from "@/lib/utils/utils";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { withRateLimit } from "@/middleware/rateLimit";
import { PLATFORM_LIMITS } from "@/constants";

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

  return withRateLimit(async (req: Request) => {
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

      const mediaIds: { mediaId: string; url: string; type: string }[] = [];

      // Upload mediów
      if (mediaUrls && mediaUrls.length > 0) {
        for (let i = 0; i < Math.min(mediaUrls.length, 4); i++) {
          const mediaData = mediaUrls[i];
          const mediaType = mediaData.type || "application/octet-stream";

          // Sprawdź czy dane są poprawne
          if (!mediaData.data) {
            console.error("Brak danych mediów:", mediaData);
            throw new Error(
              `Nieprawidłowe dane mediów dla pliku ${i + 1}: brak danych`
            );
          }

          // Konwersja danych na Uint8Array
          let binaryData;
          try {
            if (Array.isArray(mediaData.data)) {
              binaryData = new Uint8Array(mediaData.data);
            } else if (typeof mediaData.data === "string") {
              // Jeśli dane są w formacie base64
              binaryData = new Uint8Array(
                Buffer.from(mediaData.data, "base64")
              );
            } else {
              throw new Error(`Nieprawidłowy format danych dla pliku ${i + 1}`);
            }
          } catch (error) {
            console.error("Błąd konwersji danych:", error);
            throw new Error(
              `Nie udało się przetworzyć danych mediów dla pliku ${i + 1}`
            );
          }

          // Konwertuj dane na base64
          const mediaBlob = new Blob([binaryData], { type: mediaType });

          // Upload do S3
          const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            `http://${req.headers.get("host")}`;
          const uploadResponse = await fetch(`${baseUrl}/api/media/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "X-File-Name": `${Date.now()}-file`,
              "X-File-Type": mediaType,
            },
            body: mediaBlob,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Błąd S3:", errorText);
            throw new Error("Błąd podczas uploadu do S3");
          }

          const { url: s3Url } = await uploadResponse.json();

          // Określ typ mediów dla Twittera
          let mediaCategory = "tweet_image";
          if (mediaType.startsWith("video/")) {
            mediaCategory = "tweet_video";
          }

          // Pobierz plik z S3
          const s3Response = await fetch(s3Url);
          if (!s3Response.ok) {
            throw new Error(
              `Nie udało się pobrać pliku z S3: ${s3Response.statusText}`
            );
          }
          const s3Blob = await s3Response.blob();

          // Sprawdź rozmiar pliku
          if (
            s3Blob.size >
            (mediaCategory === "tweet_video"
              ? PLATFORM_LIMITS.twitter.maxVideoSize
              : PLATFORM_LIMITS.twitter.maxImageSize)
          ) {
            throw new Error(
              `Plik jest zbyt duży. Maksymalny rozmiar to ${
                mediaCategory === "tweet_video"
                  ? PLATFORM_LIMITS.twitter.maxVideoSize
                  : PLATFORM_LIMITS.twitter.maxImageSize
              }MB.`
            );
          }

          const initForm = new FormData();
          initForm.append("command", "INIT");
          initForm.append("total_bytes", s3Blob.size.toString());
          initForm.append("media_type", mediaType);
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

            // Zapisujemy URL z S3 i ID mediów
            mediaIds.push({
              mediaId: media_id_string,
              url: s3Url,
              type: mediaType,
            });

            // Step 2: APPEND - dzielenie na chunki
            const CHUNK_SIZE = 1024 * 1024; // 1MB
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
          } catch (error) {
            console.error("Error while processing INIT:", error);
            throw error;
          }
        }
      }

      // Tworzenie posta z mediami
      const postData = {
        text: content,
        media: { media_ids: mediaIds.map((m) => m.mediaId) },
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
        const errorText = await postResponse.text();
        console.error("Błąd odpowiedzi Twitter:", {
          status: postResponse.status,
          statusText: postResponse.statusText,
          errorText,
          postData,
        });
        throw new Error(
          `Nie udało się opublikować posta na Twitter: ${errorText}`
        );
      }

      const responseData = await postResponse.json();

      const postUrl = `https://twitter.com/${account.username}/status/${responseData.data.id}`;

      // --- ZAPIS DO BAZY ---
      const createdPost = await db.post.create({
        data: {
          content,
          status: "PUBLISHED",
          published: true,
          publishedAt: new Date(),
          userId: session.user.id,
          media: {
            create: mediaIds.map((m) => ({
              url: m.url,
              type: m.type.startsWith("video/") ? "VIDEO" : "IMAGE",
            })),
          },
          postConnectedAccounts: {
            create: [
              {
                connectedAccountId: account.id,
                status: "PUBLISHED",
                postUrl: postUrl,
                publishedAt: new Date(),
              },
            ],
          },
        },
        include: {
          media: true,
          postConnectedAccounts: true,
        },
      });
      // --- KONIEC ZAPISU DO BAZY ---

      return NextResponse.json({
        success: true,
        data: {
          tweetId: responseData.data.id,
          mediaIds: mediaIds.map((m) => m.mediaId),
          mediaUrls: mediaIds.map((m) => ({ url: m.url, type: m.type })),
          postUrl: postUrl,
          post: createdPost,
        },
      });
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
  })(req);
}
