import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MediaType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // Sprawdzenie autoryzacji
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Brak autoryzacji",
          details: "Zaloguj się, aby kontynuować",
        },
        { status: 401 }
      );
    }

    // Walidacja danych wejściowych
    const body = await req.json();
    const { content, mediaUrls, accountIds, scheduledDate } = body;

    // Walidacja treści
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Nieprawidłowa treść posta",
          details: "Treść posta nie może być pusta",
        },
        { status: 400 }
      );
    }

    // Walidacja długości treści
    if (content.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "Treść zbyt długa",
          details: "Maksymalna długość posta to 2000 znaków",
        },
        { status: 400 }
      );
    }

    // Walidacja kont
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Brak wybranych kont",
          details: "Wybierz przynajmniej jedno konto do publikacji",
        },
        { status: 400 }
      );
    }

    // Walidacja mediów
    if (mediaUrls) {
      if (!Array.isArray(mediaUrls)) {
        return NextResponse.json(
          {
            success: false,
            error: "Nieprawidłowy format mediów",
            details: "Media muszą być przekazane jako tablica",
          },
          { status: 400 }
        );
      }

      // Sprawdź czy wszystkie media mają wymagane pola
      const invalidMedia = mediaUrls.find(
        (media: any) => !media || typeof media !== "object" || !media.url
      );
      if (invalidMedia) {
        return NextResponse.json(
          {
            success: false,
            error: "Nieprawidłowy format mediów",
            details: "Każde medium musi mieć pole 'url'",
          },
          { status: 400 }
        );
      }
    }

    // Walidacja daty publikacji
    if (scheduledDate) {
      const scheduledDateObj = new Date(scheduledDate);
      if (isNaN(scheduledDateObj.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Nieprawidłowa data publikacji",
            details: "Podaj prawidłową datę w formacie ISO",
          },
          { status: 400 }
        );
      }

      if (scheduledDateObj < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: "Nieprawidłowa data publikacji",
            details: "Data publikacji nie może być z przeszłości",
          },
          { status: 400 }
        );
      }
    }

    // Przygotuj dane mediów
    const mediaData =
      mediaUrls?.map((media: { url: string; thumbnailUrl: string | null }) => {
        if (!media?.url) {
          throw new Error("Nieprawidłowy format mediów - brak URL");
        }

        const isBase64 = media.url.startsWith("data:");
        const isVideo = isBase64
          ? media.url.includes("video/")
          : !!media.url.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i);

        return {
          url: media.url,
          type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
          thumbnailUrl: isVideo ? media.thumbnailUrl : null,
        };
      }) || [];

    // Tworzenie posta w bazie danych
    const post = await db.post.create({
      data: {
        content,
        published: !scheduledDate,
        publishedAt: scheduledDate,
        userId: session.user.id,
        media: {
          create: mediaData,
        },
        postConnectedAccounts: {
          create: accountIds.map((accountId: string) => ({
            connectedAccountId: accountId,
          })),
        },
      },
      include: {
        media: true,
        postConnectedAccounts: {
          include: {
            connectedAccount: true,
          },
        },
      },
    });

    // Jeśli post jest zaplanowany, zwróć sukces
    if (scheduledDate) {
      return NextResponse.json({
        success: true,
        data: post,
      });
    }

    // Pobierz konta do publikacji
    const accounts = await db.connectedAccount.findMany({
      where: {
        id: {
          in: accountIds,
        },
      },
    });

    // Publikuj sekwencyjnie na każdej platformie
    const results = [];
    for (const account of accounts) {
      try {
        let response;
        switch (account.provider) {
          case "TWITTER":
            response = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/api/posts/twitter`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  content,
                  mediaUrls,
                  accountId: account.id,
                }),
              }
            );
            break;
          // Tutaj dodamy kolejne platformy
          default:
            throw new Error(`Nieobsługiwana platforma: ${account.provider}`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || errorData.error || "Nieznany błąd"
          );
        }

        const result = await response.json();
        results.push({
          accountId: account.id,
          provider: account.provider,
          success: true,
          data: result.data,
        });
      } catch (error) {
        results.push({
          accountId: account.id,
          provider: account.provider,
          success: false,
          error: error instanceof Error ? error.message : "Nieznany błąd",
        });
      }
    }

    // Aktualizuj status posta w bazie danych
    await db.post.update({
      where: { id: post.id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: post,
      results,
    });
  } catch (error) {
    console.error("[POSTS_POST]", error);

    // Obsługa specyficznych błędów bazy danych
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Błąd duplikacji",
            details: "Ten post już istnieje",
          },
          { status: 409 }
        );
      }

      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Błąd relacji",
            details: "Nieprawidłowe powiązanie z kontem",
          },
          { status: 400 }
        );
      }
    }

    // Ogólny błąd serwera
    return NextResponse.json(
      {
        success: false,
        error: "Wystąpił błąd wewnętrzny serwera",
        details: "Spróbuj ponownie później",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Brak autoryzacji",
          details: "Zaloguj się, aby kontynuować",
        },
        { status: 401 }
      );
    }

    const posts = await db.post.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        media: true,
        postConnectedAccounts: {
          include: {
            connectedAccount: {
              select: {
                provider: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Błąd podczas pobierania postów:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Wystąpił błąd podczas pobierania postów",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
