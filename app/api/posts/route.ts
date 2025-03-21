import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MediaType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content, mediaUrls, accountIds, scheduledDate } = body;

    if (!content || !accountIds?.length) {
      return NextResponse.json(
        { error: "Brak wymaganych danych" },
        { status: 400 }
      );
    }

    // Przygotuj dane mediów
    const mediaData = mediaUrls.map(
      (media: { url: string; thumbnailUrl: string | null }) => ({
        url: media.url, // URL będzie już w formacie base64
        type: media.url.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i)
          ? MediaType.VIDEO
          : MediaType.IMAGE,
        thumbnailUrl: media.thumbnailUrl, // Thumbnail też będzie w formacie base64
      })
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
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
