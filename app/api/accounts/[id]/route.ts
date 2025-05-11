import { NextRequest, NextResponse } from "next/server";
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

// Funkcja do odświeżania tokenu TikTok
async function refreshTikTokToken(refreshToken: string) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;

    if (!clientKey) {
      throw new Error("Brak konfiguracji TikTok");
    }

    const formData = new URLSearchParams();
    formData.append("client_key", clientKey);
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);

    const response = await fetch(
      "https://open-api.tiktok.com/oauth/refresh_token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Błąd podczas odświeżania tokenu TikTok");
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("Błąd podczas odświeżania tokenu TikTok:", error);
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
  } else if (account.provider === "TIKTOK") {
    if (!account.refreshToken) {
      return;
    }
    const newTokens = await refreshTikTokToken(account.refreshToken);
    if (newTokens) {
      await db.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
        },
      });
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    const id = request.nextUrl.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Nie podano identyfikatora konta" },
        { status: 400 }
      );
    }

    // Sprawdź, czy konto należy do zalogowanego użytkownika
    const account = await db.connectedAccount.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Nie znaleziono konta lub brak uprawnień" },
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
      { success: true, message: "Konto zostało pomyślnie usunięte" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd podczas usuwania konta:", error);
    return NextResponse.json(
      { success: false, error: "Wystąpił błąd podczas usuwania konta" },
      { status: 500 }
    );
  }
}
