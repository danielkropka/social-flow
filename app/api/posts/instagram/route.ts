import { getAuthSession } from "@/lib/config/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { decryptToken } from "@/lib/utils/utils";

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

  try {
    // 1. Upload mediów do S3 jeśli trzeba, zbierz publiczne linki
    const s3MediaUrls: { url: string; type: string }[] = [];
    if (mediaUrls && mediaUrls.length > 0) {
      for (const media of mediaUrls) {
        // Jeśli media.url już istnieje i jest publicznym linkiem, użyj go
        if (media.url && media.url.startsWith("http")) {
          s3MediaUrls.push({ url: media.url, type: media.type });
          continue;
        }
        // W przeciwnym razie uploaduj do S3
        const mediaType = media.type || "application/octet-stream";
        let binaryData;
        if (Array.isArray(media.data)) {
          binaryData = new Uint8Array(media.data);
        } else if (typeof media.data === "string") {
          binaryData = new Uint8Array(Buffer.from(media.data, "base64"));
        } else {
          return NextResponse.json(
            {
              error: "Nieprawidłowy format danych mediów",
              details: "Plik nie jest poprawnym obrazem lub wideo.",
              code: "INVALID_MEDIA_FORMAT",
            },
            { status: 400 }
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
          return NextResponse.json(
            {
              error: "Błąd podczas uploadu do S3",
              details: errorText,
              code: "S3_UPLOAD_ERROR",
            },
            { status: 400 }
          );
        }
        const { url: s3Url } = await uploadResponse.json();
        s3MediaUrls.push({ url: s3Url, type: mediaType });
      }
    }

    // 2. Upload do Instagram Graph API (przekazuj linki z S3)
    const mediaObjectIds: string[] = [];
    if (s3MediaUrls.length > 0) {
      for (const media of s3MediaUrls) {
        const creationUrl = `https://graph.facebook.com/v22.0/${instagramUserId}/media`;
        const mediaType = media.type.startsWith("video/") ? "video" : "image";
        const params: Record<string, string> = {
          access_token: accessToken,
        };
        if (mediaType === "image") {
          params["image_url"] = media.url;
        } else if (mediaType === "video") {
          params["video_url"] = media.url;
        }
        if (content) {
          params["caption"] = content;
        }
        const formData = new URLSearchParams(params);
        const creationRes = await fetch(creationUrl, {
          method: "POST",
          body: formData,
        });
        const creationData = await creationRes.json();
        if (!creationRes.ok || !creationData.id) {
          return NextResponse.json(
            {
              error: "Błąd podczas tworzenia kontenera mediów na Instagramie",
              details: creationData,
              code: "INSTAGRAM_API_ERROR",
            },
            { status: 400 }
          );
        }
        mediaObjectIds.push(creationData.id);
      }
    }

    // 3. Publikacja posta (jeden lub karuzela)
    const publishUrl = `https://graph.facebook.com/v22.0/${instagramUserId}/media_publish`;
    const publishParams: Record<string, string> = {
      access_token: accessToken,
    };
    if (mediaObjectIds.length === 1) {
      publishParams["creation_id"] = mediaObjectIds[0];
    } else if (mediaObjectIds.length > 1) {
      // Karuzela (album)
      const carouselUrl = `https://graph.facebook.com/v22.0/${instagramUserId}/media`;
      const carouselParams: Record<string, string> = {
        access_token: accessToken,
        media_type: "CAROUSEL",
        children: mediaObjectIds.join(","),
      };
      if (content) {
        carouselParams["caption"] = content;
      }
      const carouselForm = new URLSearchParams(carouselParams);
      const carouselRes = await fetch(carouselUrl, {
        method: "POST",
        body: carouselForm,
      });
      const carouselData = await carouselRes.json();
      if (!carouselRes.ok || !carouselData.id) {
        return NextResponse.json(
          {
            error: "Błąd podczas tworzenia karuzeli na Instagramie",
            details: carouselData,
            code: "INSTAGRAM_API_ERROR",
          },
          { status: 400 }
        );
      }
      publishParams["creation_id"] = carouselData.id;
    }

    // Publikuj post
    const publishForm = new URLSearchParams(publishParams);
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      body: publishForm,
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return NextResponse.json(
        {
          error: "Błąd podczas publikacji posta na Instagramie",
          details: publishData,
          code: "INSTAGRAM_API_ERROR",
        },
        { status: 400 }
      );
    }

    // Zwróć sukces
    return NextResponse.json({
      success: true,
      data: {
        instagramPostId: publishData.id,
        mediaObjectIds,
        s3MediaUrls,
      },
    });
  } catch (error) {
    console.error("Błąd podczas publikacji na Instagramie:", error);
    return NextResponse.json(
      {
        error: "Wystąpił błąd podczas publikacji na Instagramie.",
        details: error instanceof Error ? error.message : error,
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
