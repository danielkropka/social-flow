import { authOptions } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { publishInstagramPost, publishTwitterPost } from "@/lib/publish";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, provider, accountId } = body;

  if (!postId || !provider || !accountId) {
    return NextResponse.json(
      { error: "Brak wymaganych pól: postId, provider lub accountId" },
      { status: 400 }
    );
  }

  const post = await db.post.findFirst({
    where: {
      id: postId,
      userId: session.user.id,
    },
    include: {
      media: true,
      postConnectedAccounts: true,
    },
  });

  if (!post) {
    return NextResponse.json(
      { error: "Nie znaleziono posta" },
      { status: 404 }
    );
  }

  const account = await db.connectedAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      provider: provider.toUpperCase(),
    },
  });

  if (!account) {
    return NextResponse.json(
      { error: `Nie znaleziono konta ${provider}` },
      { status: 404 }
    );
  }

  try {
    let publishResult = null;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || `http://${req.headers.get("host")}`;
    switch (provider.toLowerCase()) {
      case "instagram":
        publishResult = await publishInstagramPost({
          content: post.content,
          mediaUrls: post.media.map((media) => ({
            data: media.url,
            type: media.type,
          })),
          account,
          baseUrl,
        });
        break;
      case "twitter":
        publishResult = await publishTwitterPost({
          content: post.content,
          mediaUrls: post.media.map((media) => ({
            data: media.url,
            type: media.type,
          })),
          account,
          baseUrl,
        });
        break;
      case "facebook":
        publishResult = {
          success: false,
          message: "Publikacja na Facebooku niezaimplementowana",
        };
      case "tiktok":
        publishResult = {
          success: false,
          message: "Publikacja na TikToku niezaimplementowana",
        };
        break;
      default:
        return NextResponse.json(
          { error: "Nieobsługiwany provider" },
          { status: 400 }
        );
    }

    await db.post.update({
      where: { id: postId },
      data: {
        status: publishResult.success ? "PUBLISHED" : "FAILED",
        published: publishResult.success,
        publishedAt: publishResult.success ? new Date() : undefined,
        postConnectedAccounts: {
          updateMany: {
            where: { connectedAccountId: accountId },
            data: {
              status: publishResult.success ? "PUBLISHED" : "FAILED",
              publishedAt: publishResult.success ? new Date() : undefined,
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: publishResult.success,
      message: publishResult.message,
      postUrl: publishResult.postUrl,
    });
  } catch (error) {
    let details = "Nieznany błąd";
    const message =
      "Coś poszło nie tak podczas publikacji posta. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.";
    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("nie znaleziono")
      ) {
        details =
          "Nie znaleziono posta lub konta. Odśwież stronę i spróbuj ponownie.";
      } else if (error.message.includes("ECONNREFUSED")) {
        details = "Brak połączenia z serwerem. Spróbuj ponownie później.";
      } else {
        details = error.message;
      }
    }
    return NextResponse.json(
      {
        error: message,
        details,
      },
      { status: 500 }
    );
  }
}
