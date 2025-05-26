import { getAuthSession } from "@/lib/config/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { decryptToken } from "@/lib/utils/utils";
import { withRateLimit } from "@/middleware/rateLimit";
import { PLATFORM_LIMITS } from "@/constants";

// --- Funkcja pomocnicza do uploadu do S3 ---
async function uploadMediaToS3(
  binaryData: Uint8Array,
  mediaType: string,
  req: Request
): Promise<string> {
  const mediaBlob = new Blob([binaryData], { type: mediaType });
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || `http://${req.headers.get("host")}`;
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

export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, mediaUrls, accountId } = await req.json();

  // Pobierz konto Instagram powiązane z użytkownikiem
  const account = await db.connectedAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      provider: "INSTAGRAM",
    },
  });

  if (!account || !account.accessToken) {
    return NextResponse.json(
      {
        error: "Nie znaleziono konta Instagram lub brak tokenu dostępu",
        details: "Połącz konto Instagram i spróbuj ponownie.",
        code: "ACCOUNT_NOT_FOUND",
      },
      { status: 400 }
    );
  }

  const accessToken = decryptToken(account.accessToken);
  const instagramUserId = account.providerAccountId;

  if (!accessToken || !instagramUserId) {
    return NextResponse.json(
      {
        error: "Brak tokenu dostępu lub ID użytkownika Instagram",
        details: "Spróbuj ponownie połączyć konto Instagram.",
        code: "MISSING_TOKEN_OR_ID",
      },
      { status: 400 }
    );
  }

  return withRateLimit(async (req: Request) => {
    try {
      const mediaIds: { mediaId: string; url: string; type: string }[] = [];

      if (mediaUrls && mediaUrls.length > 0) {
        if (mediaUrls.length === 1) {
          // --- POJEDYNCZE MEDIUM ---
          const mediaData = mediaUrls[0];
          const mediaType = mediaData.type || "application/octet-stream";

          if (!mediaData.data) {
            console.error("Brak danych mediów:", mediaData);
            throw new Error(`Nieprawidłowe dane mediów: brak danych`);
          }

          let binaryData;
          try {
            if (Array.isArray(mediaData.data)) {
              binaryData = new Uint8Array(mediaData.data);
            } else if (typeof mediaData.data === "string") {
              binaryData = new Uint8Array(
                Buffer.from(mediaData.data, "base64")
              );
            } else {
              throw new Error(`Nieprawidłowy format danych dla pliku`);
            }
          } catch (error) {
            console.error("Błąd konwersji danych:", error);
            throw new Error(`Nie udało się przetworzyć danych mediów`);
          }

          const s3Url = await uploadMediaToS3(binaryData, mediaType, req);

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
          // --- CAROUSEL ---
          for (
            let i = 0;
            i <
            Math.min(mediaUrls.length, PLATFORM_LIMITS.instagram.maxMediaCount);
            i++
          ) {
            const mediaData = mediaUrls[i];
            const mediaType = mediaData.type || "application/octet-stream";

            if (!mediaData.data) {
              console.error("Brak danych mediów:", mediaData);
              throw new Error(
                `Nieprawidłowe dane mediów dla pliku ${i + 1}: brak danych`
              );
            }

            let binaryData;
            try {
              if (Array.isArray(mediaData.data)) {
                binaryData = new Uint8Array(mediaData.data);
              } else if (typeof mediaData.data === "string") {
                binaryData = new Uint8Array(
                  Buffer.from(mediaData.data, "base64")
                );
              } else {
                throw new Error(
                  `Nieprawidłowy format danych dla pliku ${i + 1}`
                );
              }
            } catch (error) {
              console.error("Błąd konwersji danych:", error);
              throw new Error(
                `Nie udało się przetworzyć danych mediów dla pliku ${i + 1}`
              );
            }

            const s3Url = await uploadMediaToS3(binaryData, mediaType, req);

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

      // --- Nowa logika obsługi carousel i pojedynczych mediów ---
      let finalContainerId: string | null = null;
      if (mediaIds.length > 1) {
        // Tworzymy kontener carousel
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

      // Publikacja kontenera (pojedynczego lub carousel)
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

      const publishData = await publishResponse.json();

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
              type: m.type === "video" ? "VIDEO" : "IMAGE",
            })),
          },
          postConnectedAccounts: {
            create: [
              {
                connectedAccountId: account.id,
                status: "PUBLISHED",
                postUrl: `https://instagram.com/${account.username}`,
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
          postId: publishData.id,
          mediaIds: mediaIds.map((m) => m.mediaId),
          mediaUrls: mediaIds.map((m) => ({ url: m.url, type: m.type })),
          post: createdPost,
        },
      });
    } catch (error) {
      console.error("Błąd podczas publikacji na Instagramie:", error);
      return NextResponse.json(
        {
          error: "Nie udało się opublikować posta na Instagramie",
          details: error instanceof Error ? error.message : "Nieznany błąd",
        },
        { status: 500 }
      );
    }
  })(req);
}
