import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();

type Props = {
  params: {
    id: string;
  };
};

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
async function handleTokenRefresh(account: any) {
  if (account.provider === "instagram") {
    const newToken = await refreshInstagramToken(account.accessToken);
    if (newToken) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessToken: newToken,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 dni
        },
      });
    }
  }
}

export async function DELETE(request: Request, props: Props) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    // Sprawdź, czy konto należy do zalogowanego użytkownika
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: props.params.id,
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
    await prisma.connectedAccount.delete({
      where: {
        id: props.params.id,
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
