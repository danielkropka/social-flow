import { NextResponse } from "next/server";
import { ConnectedAccount } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
// Funkcja do odświeżania tokenu Instagram
async function refreshInstagramToken(accessToken: string) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.access_token) {
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error("Błąd podczas odświeżania tokenu Instagram:", error);
    return null;
  }
}

// Funkcja do automatycznego odświeżania tokenu
async function handleTokenRefresh(account: ConnectedAccount) {
  if (account.provider === "INSTAGRAM") {
    const newToken = await refreshInstagramToken(account.accessToken);
    if (newToken) {
      await db.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessToken: newToken,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 dni
        },
      });
    }
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    // Sprawdź, czy konto należy do zalogowanego użytkownika
    const account = await db.connectedAccount.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Nie znaleziono konta lub brak uprawnień" },
        { status: 404 }
      );
    }

    // Próba odświeżenia tokenu przed usunięciem
    await handleTokenRefresh(account);

    // Usuń konto
    await db.connectedAccount.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Konto zostało pomyślnie usunięte" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd podczas usuwania konta:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania konta" },
      { status: 500 }
    );
  }
}
