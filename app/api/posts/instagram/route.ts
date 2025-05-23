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
      { error: "Nie znaleziono konta Instagram lub brak tokenu dostępu" },
      { status: 400 }
    );
  }

  const accessToken = decryptToken(account.accessToken);
  const instagramUserId = account.providerAccountId;

  if (!accessToken || !instagramUserId) {
    return NextResponse.json(
      { error: "Brak tokenu dostępu lub ID użytkownika Instagram" },
      { status: 400 }
    );
  }

  try {
    // 1. Upload mediów do Instagram Graph API (jeśli są)
    let mediaObjectIds: string[] = [];
    if (mediaUrls && mediaUrls.length > 0) {
      for (const media of mediaUrls) {
        // Instagram wymaga najpierw utworzenia kontenera mediów
        // Obsługa tylko zdjęć i filmów (image_url lub video_url)
        let creationUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media`;
        let mediaType = media.type.startsWith("video/") ? "video" : "image";
        let params: Record<string, string> = {
          access_token: accessToken,
        };
        if (mediaType === "image") {
          params["image_url"] =
            media.url || media.s3Url || media.mediaUrl || media.url;
        } else if (mediaType === "video") {
          params["video_url"] =
            media.url || media.s3Url || media.mediaUrl || media.url;
        }
        if (content) {
          params["caption"] = content;
        }
        // Utwórz kontener mediów
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
            },
            { status: 400 }
          );
        }
        mediaObjectIds.push(creationData.id);
      }
    }

    // 2. Publikacja posta (jeden lub karuzela)
    let publishUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`;
    let publishParams: Record<string, string> = {
      access_token: accessToken,
    };
    if (mediaObjectIds.length === 1) {
      publishParams["creation_id"] = mediaObjectIds[0];
    } else if (mediaObjectIds.length > 1) {
      // Karuzela (album)
      // Najpierw utwórz kontener karuzeli
      const carouselUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media`;
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
      },
    });
  } catch (error) {
    console.error("Błąd podczas publikacji na Instagramie:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas publikacji na Instagramie",
      },
      { status: 500 }
    );
  }
}
