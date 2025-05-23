import { db } from "@/lib/config/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { NextResponse } from "next/server";
import { MediaType, Prisma, Provider } from "@prisma/client";
import { withRateLimit } from "@/middleware/rateLimit";

export async function POST(req: Request) {
  return withRateLimit(async (req: Request) => {
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
                mediaUrls?.map((media: { type: string }) => ({
                  url: "",
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
      const uploadedMediaUrls = [];

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

              const result = await response.json();

              if (response.ok) {
                if (result.data?.mediaUrls) {
                  uploadedMediaUrls.push(...result.data.mediaUrls);
                }

                results.push({
                  accountId: account.id,
                  provider: account.provider,
                  success: true,
                  data: result.data,
                });
              } else {
                throw new Error(
                  result.details || result.error || "Nieznany błąd"
                );
              }
              break;
            case "INSTAGRAM":
              response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/api/posts/instagram`,
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

              const instaResult = await response.json();

              if (response.ok) {
                // Instagram nie zwraca mediaUrls, ale można dodać obsługę jeśli będzie potrzebna
                results.push({
                  accountId: account.id,
                  provider: account.provider,
                  success: true,
                  data: instaResult.data,
                });
              } else {
                throw new Error(
                  instaResult.details || instaResult.error || "Nieznany błąd"
                );
              }
              break;
            default:
              throw new Error(`Nieobsługiwana platforma: ${account.provider}`);
          }
        } catch (error) {
          results.push({
            accountId: account.id,
            provider: account.provider,
            success: false,
            error:
              error instanceof Error
                ? error.message
                : typeof error === "object"
                ? JSON.stringify(error)
                : String(error),
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
            details:
              "Nie udało się opublikować posta na wszystkich platformach",
            results,
          },
          { status: 400 }
        );
      }

      // Zapisz post w bazie
      const post = await db.post.create({
        data: {
          content,
          published: true,
          publishedAt: new Date(),
          userId: session.user.id,
          media: {
            create:
              uploadedMediaUrls?.map((media) => ({
                url: media.url || "",
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

      // Aktualizuj postUrl dla każdego konta
      for (const result of results) {
        if (result.success && result.data?.postUrl) {
          await db.postConnectedAccount.update({
            where: {
              postId_connectedAccountId: {
                postId: post.id,
                connectedAccountId: result.accountId,
              },
            },
            data: {
              postUrl: result.data.postUrl,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: post,
        results,
      });
    } catch (error) {
      console.error("[POSTS_POST]", error);

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

      return NextResponse.json(
        {
          success: false,
          error: "Wystąpił błąd wewnętrzny serwera",
          details: error instanceof Error ? error.message : "Nieznany błąd",
        },
        { status: 500 }
      );
    }
  })(req);
}

export async function GET(req: Request) {
  return withRateLimit(async (req: Request) => {
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

      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get("limit") || "10");
      const cursor = searchParams.get("cursor");
      const search = searchParams.get("search");
      const status = searchParams.get("status");
      const platform = searchParams.get("platform");

      const where: Prisma.PostWhereInput = {
        userId: session.user.id,
      };

      if (search) {
        where.content = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (status) {
        switch (status) {
          case "published":
            where.published = true;
            break;
          case "scheduled":
            where.published = false;
            where.publishedAt = { not: null };
            break;
          case "draft":
            where.published = false;
            where.publishedAt = null;
            break;
        }
      }

      if (platform) {
        where.postConnectedAccounts = {
          some: {
            connectedAccount: {
              provider: platform.toUpperCase() as Provider,
            },
          },
        };
      }

      const posts = await db.post.findMany({
        where,
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
        take: limit + 1,
        ...(cursor && {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }),
      });

      const hasNextPage = posts.length > limit;
      const items = hasNextPage ? posts.slice(0, -1) : posts;
      const nextCursor = hasNextPage ? posts[posts.length - 1].id : null;

      return NextResponse.json({
        success: true,
        posts: items,
        nextCursor,
      });
    } catch (error) {
      console.error("[POSTS_GET]", error);
      return NextResponse.json(
        {
          success: false,
          error: "Wystąpił błąd podczas pobierania postów",
          details: error instanceof Error ? error.message : "Nieznany błąd",
        },
        { status: 500 }
      );
    }
  })(req);
}
