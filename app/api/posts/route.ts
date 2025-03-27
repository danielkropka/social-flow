import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MediaType } from "@prisma/client";
import { createApiError } from "@/lib/api";
import { API_ERROR_CODES } from "@/types/api";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError(API_ERROR_CODES.UNAUTHORIZED, "Brak autoryzacji")
      );
    }

    const body = await req.json();
    const { content, mediaUrls, accountIds, scheduledDate } = body;

    if (!content || !accountIds?.length) {
      return NextResponse.json(
        createApiError(
          API_ERROR_CODES.VALIDATION_ERROR,
          "Brak wymaganych danych"
        ),
        { status: 400 }
      );
    }

    // Przygotuj dane mediów
    const mediaData = mediaUrls.map(
      (media: { url: string; thumbnailUrl: string | null }) => {
        // Sprawdź czy URL jest w formacie base64
        const isBase64 = media.url.startsWith("data:");
        const isVideo = isBase64
          ? media.url.includes("video/")
          : !!media.url.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i);

        return {
          url: media.url,
          type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
          thumbnailUrl: isVideo ? media.thumbnailUrl : null,
        };
      }
    );

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

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POSTS_POST]", error);
    return NextResponse.json(
      createApiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "Wystąpił błąd wewnętrzny serwera"
      ),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const posts = await db.post.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        media: true,
        postConnectedAccounts: {
          include: {
            connectedAccount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[POSTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
