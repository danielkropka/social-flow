import { decryptToken } from "@/lib/utils/utils";
import { PLATFORM_LIMITS } from "@/constants";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { ConnectedAccount } from "@prisma/client";

// --- Funkcja pomocnicza do uploadu do S3 ---
export async function uploadMediaToS3(
  binaryData: Uint8Array,
  mediaType: string,
  baseUrl: string
): Promise<string> {
  const mediaBlob = new Blob([binaryData], { type: mediaType });
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
    throw new Error("Błąd podczas uploadu do S3: " + errorText);
  }
  const { url: s3Url } = await uploadResponse.json();
  return s3Url;
}

// --- Funkcja pomocnicza do oczekiwania na gotowość media na Instagramie ---
async function waitForMediaReady(
  mediaId: string,
  accessToken: string,
  maxTries = 10,
  intervalMs = 3000
): Promise<void> {
  for (let i = 0; i < maxTries; i++) {
    const statusRes = await fetch(
      `https://graph.instagram.com/v22.0/${mediaId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") {
      return;
    }
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  throw new Error("Media nie są gotowe do publikacji po wielu próbach.");
}

// --- Publikacja na Instagramie ---
export async function publishInstagramPost({
  content,
  mediaUrls,
  account,
  baseUrl,
}: {
  content: string;
  mediaUrls: Array<{ data: string | number[]; type: string }>;
  account: ConnectedAccount;
  baseUrl: string;
}): Promise<{ success: boolean; message: string; postUrl?: string }> {
  if (!account || !account.accessToken) {
    return {
      success: false,
      message: "Nie znaleziono konta Instagram lub brak tokenu dostępu",
    };
  }
  const accessToken = decryptToken(account.accessToken);
  const instagramUserId = account.providerAccountId;
  if (!accessToken || !instagramUserId) {
    return {
      success: false,
      message: "Brak tokenu dostępu lub ID użytkownika Instagram",
    };
  }
  try {
    const mediaIds: { mediaId: string; url: string; type: string }[] = [];
    if (mediaUrls && mediaUrls.length > 0) {
      if (mediaUrls.length === 1) {
        // Pojedyncze medium
        const mediaData = mediaUrls[0];
        const mediaType = mediaData.type || "application/octet-stream";
        let binaryData;
        if (Array.isArray(mediaData.data)) {
          binaryData = new Uint8Array(mediaData.data);
        } else if (typeof mediaData.data === "string") {
          binaryData = new Uint8Array(Buffer.from(mediaData.data, "base64"));
        } else {
          throw new Error(`Nieprawidłowy format danych dla pliku`);
        }
        const s3Url = await uploadMediaToS3(binaryData, mediaType, baseUrl);
        let mediaCategory = "image";
        if (mediaType.startsWith("video/")) {
          mediaCategory = "video";
        }
        const s3Response = await fetch(s3Url);
        if (!s3Response.ok) {
          throw new Error(
            `Nie udało się pobrać pliku z S3: ${s3Response.statusText}`
          );
        }
        const s3Blob = await s3Response.blob();
        if (
          s3Blob.size >
          (mediaCategory === "video"
            ? PLATFORM_LIMITS.instagram.maxVideoSize
            : PLATFORM_LIMITS.instagram.maxImageSize)
        ) {
          throw new Error(
            `Plik jest zbyt duży. Maksymalny rozmiar to ${PLATFORM_LIMITS.instagram.maxVideoSize}MB.`
          );
        }
        const initForm = {
          caption: content || "",
          image_url: s3Url,
        };
        const initRequestData = {
          url: `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
          method: "POST",
        };
        const initResponse = await fetch(initRequestData.url, {
          method: initRequestData.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(initForm),
        });
        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          throw new Error(
            `Błąd podczas inicjalizacji uploadu mediów: ${errorText}`
          );
        }
        const initData = await initResponse.json();
        const { id } = initData;
        await waitForMediaReady(id, accessToken);
        mediaIds.push({ mediaId: id, url: s3Url, type: mediaCategory });
      } else {
        // Carousel
        for (
          let i = 0;
          i <
          Math.min(mediaUrls.length, PLATFORM_LIMITS.instagram.maxMediaCount);
          i++
        ) {
          const mediaData = mediaUrls[i];
          const mediaType = mediaData.type || "application/octet-stream";
          let binaryData;
          if (Array.isArray(mediaData.data)) {
            binaryData = new Uint8Array(mediaData.data);
          } else if (typeof mediaData.data === "string") {
            binaryData = new Uint8Array(Buffer.from(mediaData.data, "base64"));
          } else {
            throw new Error(`Nieprawidłowy format danych dla pliku ${i + 1}`);
          }
          const s3Url = await uploadMediaToS3(binaryData, mediaType, baseUrl);
          let mediaCategory = "image";
          if (mediaType.startsWith("video/")) {
            mediaCategory = "video";
          }
          const s3Response = await fetch(s3Url);
          if (!s3Response.ok) {
            throw new Error(
              `Nie udało się pobrać pliku z S3: ${s3Response.statusText}`
            );
          }
          const s3Blob = await s3Response.blob();
          if (
            s3Blob.size >
            (mediaCategory === "video"
              ? PLATFORM_LIMITS.instagram.maxVideoSize
              : PLATFORM_LIMITS.instagram.maxImageSize)
          ) {
            throw new Error(
              `Plik jest zbyt duży. Maksymalny rozmiar to ${PLATFORM_LIMITS.instagram.maxVideoSize}MB.`
            );
          }
          const initForm = {
            image_url: s3Url,
            is_carousel_item: true,
          };
          const initRequestData = {
            url: `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
            method: "POST",
          };
          const initResponse = await fetch(initRequestData.url, {
            method: initRequestData.method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(initForm),
          });
          if (!initResponse.ok) {
            const errorText = await initResponse.text();
            throw new Error(
              `Błąd podczas inicjalizacji uploadu mediów: ${errorText}`
            );
          }
          const initData = await initResponse.json();
          const { id } = initData;
          await waitForMediaReady(id, accessToken);
          mediaIds.push({ mediaId: id, url: s3Url, type: mediaCategory });
        }
      }
    }
    let finalContainerId: string | null = null;
    if (mediaIds.length > 1) {
      const carouselForm = {
        caption: content || "",
        media_type: "CAROUSEL",
        children: mediaIds.map((m) => m.mediaId).join(","),
      };
      const carouselResponse = await fetch(
        `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(carouselForm),
        }
      );
      if (!carouselResponse.ok) {
        const errorText = await carouselResponse.text();
        throw new Error(
          `Błąd podczas tworzenia kontenera carousel: ${errorText}`
        );
      }
      const carouselData = await carouselResponse.json();
      finalContainerId = carouselData.id;
    } else if (mediaIds.length === 1) {
      finalContainerId = mediaIds[0].mediaId;
    } else {
      throw new Error("Brak mediów do publikacji");
    }
    const publishResponse = await fetch(
      `https://graph.instagram.com/v22.0/${instagramUserId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ creation_id: finalContainerId }),
      }
    );
    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      throw new Error(`Błąd podczas publikacji posta: ${errorText}`);
    }

    await publishResponse.json();

    const postUrl = `https://instagram.com/${account.username}`;
    return { success: true, message: "Opublikowano na Instagramie", postUrl };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}

// --- Publikacja na Twitterze ---
export async function publishTwitterPost({
  content,
  mediaUrls,
  account,
  baseUrl,
}: {
  content: string;
  mediaUrls: Array<{ data: string | number[]; type: string }>;
  account: ConnectedAccount;
  baseUrl: string;
}): Promise<{ success: boolean; message: string; postUrl?: string }> {
  if (!account || !account.accessToken || !account.accessTokenSecret) {
    return {
      success: false,
      message: "Nie znaleziono konta Twitter lub brak tokenów dostępu",
    };
  }
  const accessToken = decryptToken(account.accessToken);
  const accessTokenSecret = decryptToken(account.accessTokenSecret);
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    return {
      success: false,
      message: "Brak skonfigurowanych kluczy API Twittera",
    };
  }
  if (!accessToken || !accessTokenSecret) {
    return { success: false, message: "Brak tokenów dostępu do Twittera" };
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
    const mediaIds: { mediaId: string; url: string; type: string }[] = [];
    if (mediaUrls && mediaUrls.length > 0) {
      for (let i = 0; i < Math.min(mediaUrls.length, 4); i++) {
        const mediaData = mediaUrls[i];
        const mediaType = mediaData.type || "application/octet-stream";
        let binaryData;
        if (Array.isArray(mediaData.data)) {
          binaryData = new Uint8Array(mediaData.data);
        } else if (typeof mediaData.data === "string") {
          binaryData = new Uint8Array(Buffer.from(mediaData.data, "base64"));
        } else {
          throw new Error(`Nieprawidłowy format danych dla pliku ${i + 1}`);
        }
        const s3Url = await uploadMediaToS3(binaryData, mediaType, baseUrl);
        let mediaCategory = "tweet_image";
        if (mediaType.startsWith("video/")) {
          mediaCategory = "tweet_video";
        }
        const s3Response = await fetch(s3Url);
        if (!s3Response.ok) {
          throw new Error(
            `Nie udało się pobrać pliku z S3: ${s3Response.statusText}`
          );
        }
        const s3Blob = await s3Response.blob();
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
        const initRequestData = {
          url: "https://upload.twitter.com/1.1/media/upload.json",
          method: "POST",
        };
        const initAuthorization = oauth.authorize(initRequestData, {
          key: accessToken,
          secret: accessTokenSecret,
        });
        const initResponse = await fetch(initRequestData.url, {
          method: initRequestData.method,
          headers: {
            Authorization: oauth.toHeader(initAuthorization).Authorization,
          },
          body: initForm,
        });
        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          throw new Error(
            `Błąd podczas inicjalizacji uploadu mediów: ${errorText}`
          );
        }
        const initData = await initResponse.json();
        const { media_id_string } = initData;
        mediaIds.push({
          mediaId: media_id_string,
          url: s3Url,
          type: mediaType,
        });
        // Step 2: APPEND - dzielenie na chunki
        const CHUNK_SIZE = 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(s3Blob.size / CHUNK_SIZE);
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
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
              Authorization: oauth.toHeader(appendAuthorization).Authorization,
            },
            body: appendForm,
          });
          if (!appendResponse.ok) {
            const errorText = await appendResponse.text();
            throw new Error(
              `Błąd podczas uploadu chunka ${chunkIndex + 1} z ${totalChunks}: ${errorText}`
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
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
            Authorization: oauth.toHeader(finalizeAuthorization).Authorization,
          },
          body: finalizeForm,
        });
        if (!finalizeResponse.ok) {
          throw new Error("Błąd podczas finalizacji uploadu mediów");
        }
        const finalizeData = await finalizeResponse.json();
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
      }
    }
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
      throw new Error(
        `Nie udało się opublikować posta na Twitter: ${errorText}`
      );
    }
    const responseData = await postResponse.json();
    const postUrl = `https://twitter.com/${account.username}/status/${responseData.data.id}`;
    return { success: true, message: "Opublikowano na Twitterze", postUrl };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Nieznany błąd",
    };
  }
}
