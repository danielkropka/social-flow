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

  const { content, mediaUrls, accountIds, scheduledFor } = body;

  if (!content || !accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
    return NextResponse.json(
      { error: "Brak wymaganych pól: content lub accountIds" },
      { status: 400 }
    );
  }

  // Sprawdź czy wszystkie konta należą do użytkownika
  const accounts = await db.connectedAccount.findMany({
    where: {
      id: { in: accountIds },
      userId: session.user.id,
      status: 'ACTIVE',
    },
  });

  if (accounts.length !== accountIds.length) {
    return NextResponse.json(
      {
        error: "Nie wszystkie wybrane konta są aktywne lub należą do użytkownika",
        details: "Sprawdź status swoich kont społecznościowych.",
      },
      { status: 400 }
    );
  }

  try {
    const createdPost = await db.post.create({
      data: {
        content,
        status: scheduledFor ? "SCHEDULED" : "DRAFT",
        published: false,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
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
          create: accountIds.map((accountId: string) => ({
            connectedAccountId: accountId,
            status: "PENDING",
          })),
        },
      },
      include: {
        media: true,
        postConnectedAccounts: {
          include: {
            connectedAccount: {
              select: {
                provider: true,
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: createdPost,
    });
  } catch (error) {
    let details = "Nieznany błąd";
    const message =
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