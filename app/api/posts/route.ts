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
    console.log("Otrzymane dane:", body);
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

    // Walidacja mediów
    if (mediaUrls && !Array.isArray(mediaUrls)) {
      return NextResponse.json(
        {
          success: false,
          error: "Nieprawidłowy format mediów",
          details: "MediaUrls musi być tablicą",
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

    console.log(mediaUrls);

    // Jeśli post jest zaplanowany, zapisz go w bazie i zwróć sukces
    if (scheduledDate) {
      const post = await db.post.create({
        data: {
          content,
          published: false,
          publishedAt: scheduledDate,
          userId: session.user.id,
          media: {
            create:
              mediaUrls?.map((media: { data: number[]; type: string }) => ({
                url: "", // URL będzie ustawiony po uploadzie do S3
                type: media.type.startsWith("video/")
                  ? MediaType.VIDEO
                  : MediaType.IMAGE,
                thumbnailUrl: null,
              })) || [],
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
                  Cookie: req.headers.get("cookie") || "",
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

    // Sprawdź czy wszystkie publikacje się powiodły
    const allSuccessful = results.every((result) => result.success);
    if (!allSuccessful) {
      return NextResponse.json(
        {
          success: false,
          error: "Błąd publikacji",
          details: "Nie udało się opublikować posta na wszystkich platformach",
          results,
        },
        { status: 400 }
      );
    }

    // Jeśli wszystkie publikacje się powiodły, zapisz post w bazie
    const post = await db.post.create({
      data: {
        content,
        published: true,
        publishedAt: new Date(),
        userId: session.user.id,
        media: {
          create:
            mediaUrls?.map((media: { data: number[]; type: string }) => ({
              url: "", // URL będzie ustawiony po uploadzie do S3
              type: media.type.startsWith("video/")
                ? MediaType.VIDEO
                : MediaType.IMAGE,
              thumbnailUrl: null,
            })) || [],
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
