import { getAuthSession } from "@/lib/config/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { decryptToken } from "@/lib/utils/utils";
import { withRateLimit } from "@/middleware/rateLimit";
import { PLATFORM_LIMITS } from "@/constants";

export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, mediaUrls, accountId } = await req.json();
  console.log("content", content);

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
              throw new Error(`Nieprawidłowy format danych dla pliku ${i + 1}`);
            }
          } catch (error) {
            console.error("Błąd konwersji danych:", error);
            throw new Error(
              `Nie udało się przetworzyć danych mediów dla pliku ${i + 1}`
            );
          }

          const mediaBlob = new Blob([binaryData], { type: mediaType });

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

          console.log("S3 URL:", s3Url);

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

          const initForm = new FormData();
          initForm.append("image_url", s3Url);

          const initRequestData = {
            url: `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
            method: "POST",
          };

          try {
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
              console.error("Błąd INIT:", errorText);
              throw new Error(
                `Błąd podczas inicjalizacji uploadu mediów: ${errorText}`
              );
            }

            const initData = await initResponse.json();
            const { id } = initData;

            mediaIds.push({ mediaId: id, url: s3Url, type: mediaCategory });
          } catch (error) {
            console.error("Błąd podczas inicjalizacji uploadu mediów:", error);
            throw new Error("Błąd podczas inicjalizacji uploadu mediów");
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          mediaIds: mediaIds.map((m) => m.mediaId),
          mediaUrls: mediaIds.map((m) => ({ url: m.url, type: m.type })),
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
