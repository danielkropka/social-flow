import { db } from "@/lib/config/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Provider } from "@prisma/client";
import { withMiddlewareRateLimit } from "@/middleware/rateLimit";

export async function GET(req: NextRequest) {
  return withMiddlewareRateLimit(async (req: NextRequest) => {
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
                  displayName: true
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
