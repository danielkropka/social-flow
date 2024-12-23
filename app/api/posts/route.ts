import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, mediaUrls, accountIds, scheduledDate } = body;

    if (!content || !accountIds?.length) {
      return NextResponse.json(
        { error: "Brak wymaganych danych" },
        { status: 400 }
      );
    }

    const post = await db.post.create({
      data: {
        content,
        userId: session.user.id,
        published: !scheduledDate,
        publishedAt: scheduledDate ? new Date(scheduledDate) : new Date(),
      },
    });

    // Dodaj powiązania z kontami
    const postConnections = await db.postConnectedAccount.createMany({
      data: accountIds.map((accountId: string) => ({
        postId: post.id,
        connectedAccountId: accountId,
      })),
    });

    // Dodaj media jeśli istnieją
    if (mediaUrls?.length > 0) {
      await db.media.createMany({
        data: mediaUrls.map((url: string) => ({
          postId: post.id,
          url,
          type: url.includes("video") ? "VIDEO" : "IMAGE",
        })),
      });
    }

    // Pobierz kompletny post z relacjami
    const completePost = await db.post.findUnique({
      where: { id: post.id },
      include: {
        media: true,
        postConnectedAccounts: {
          include: {
            connectedAccount: true,
          },
        },
      },
    });

    return NextResponse.json(completePost);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
