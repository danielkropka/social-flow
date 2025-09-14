import { authOptions } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, content, mediaUrls, accountId } = body;

  if (!provider || !content || !accountId) {
    return NextResponse.json(
      { error: "Brak wymaganych pól: provider, content lub accountId" },
      { status: 400 }
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
      {
        error: `Nie znaleziono konta ${provider}`,
        details: `Spróbuj połączyć konto ${provider} ponownie.`,
      },
      { status: 400 }
    );
  }

  try {
    const createdPost = await db.post.create({
      data: {
        content,
        status: "DRAFT",
        published: false,
        userId: session.user.id,
        media:
          mediaUrls && Array.isArray(mediaUrls)
            ? {
                create: mediaUrls.map(
                  (file: { url: string; type: string }) => ({
                    url: file.url,
                    type: file.type,
                  })
                ),
              }
            : undefined,
        postConnectedAccounts: {
          create: [
            {
              connectedAccountId: account.id,
              status: "PENDING",
            },
          ],
        },
      },
      include: {
        media: true,
        postConnectedAccounts: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: createdPost,
    });
  } catch (error) {
    let details = "Nieznany błąd";
    let message =
      "Coś poszło nie tak podczas tworzenia posta. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.";
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        details = "Taki post już istnieje.";
      } else if (error.message.includes("ECONNREFUSED")) {
        details = "Brak połączenia z bazą danych. Spróbuj ponownie później.";
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
