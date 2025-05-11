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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Błąd API Instagram:", errorData);
      throw new Error(
        errorData.error?.message || "Nie udało się odświeżyć tokenu Instagram"
      );
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error("Nie otrzymano nowego tokenu dostępu");
    }

    return data.access_token;
  } catch (error) {
    console.error("Błąd podczas odświeżania tokenu Instagram:", error);
    throw error;
  }
}

// Funkcja do odświeżania tokenu TikTok
async function refreshTikTokToken(refreshToken: string) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;

    if (!clientKey) {
      throw new Error("Brak wymaganej konfiguracji TikTok");
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
      const errorData = await response.json();
      console.error("Błąd API TikTok:", errorData);
      throw new Error(
        errorData.message || "Nie udało się odświeżyć tokenu TikTok"
      );
    }

    const data = await response.json();

    if (!data.access_token || !data.refresh_token || !data.expires_in) {
      throw new Error("Nieprawidłowa odpowiedź z API TikTok");
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("Błąd podczas odświeżania tokenu TikTok:", error);
    throw error;
  }
}

// Funkcja do automatycznego odświeżania tokenu
async function handleTokenRefresh(account: ConnectedAccount) {
  try {
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
        throw new Error("Brak tokenu odświeżania dla konta TikTok");
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
  } catch (error) {
    console.error(
      `Błąd podczas odświeżania tokenu dla ${account.provider}:`,
      error
    );
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby usunąć konto",
        },
        { status: 401 }
      );
    }

    const id = request.nextUrl.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Nie podano identyfikatora konta",
          details: "Wymagany jest identyfikator konta do usunięcia",
        },
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
        {
          success: false,
          error: "Nie znaleziono konta lub brak uprawnień",
          details: "Konto nie istnieje lub nie masz do niego dostępu",
        },
        { status: 404 }
      );
    }

    try {
      // Próba odświeżenia tokenu przed usunięciem
      await handleTokenRefresh(account);
    } catch (refreshError) {
      console.error("Błąd podczas odświeżania tokenu:", refreshError);
      // Kontynuujemy usuwanie nawet jeśli odświeżanie się nie powiodło
    }

    if (account.provider === "TIKTOK") {
      try {
        const formData = new URLSearchParams();
        formData.append("open_id", account.providerAccountId!);
        formData.append("access_token", account.accessToken!);

        const response = await fetch(
          `https://open-api.tiktok.com/oauth/revoke/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Błąd API TikTok podczas usuwania konta:", errorData);
          throw new Error(
            errorData.message || "Nie udało się odwołać dostępu do konta TikTok"
          );
        }
      } catch (error) {
        console.error("Błąd podczas usuwania konta TikTok:", error);
        // Kontynuujemy usuwanie z bazy danych nawet jeśli odwołanie dostępu się nie powiodło
      }
    }

    // Usuń konto z bazy danych
    await db.connectedAccount.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Konto zostało pomyślnie usunięte",
        details: `Konto ${account.provider} zostało usunięte z systemu`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd podczas usuwania konta:", error);

    let errorMessage = "Wystąpił błąd podczas usuwania konta";
    let errorDetails =
      "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną";

    if (error instanceof Error) {
      if (error.message.includes("bazy danych")) {
        errorMessage = "Błąd bazy danych";
        errorDetails = "Nie udało się usunąć konta z bazy danych";
      } else if (error.message.includes("API")) {
        errorMessage = "Błąd komunikacji z serwisem";
        errorDetails =
          "Wystąpił problem podczas komunikacji z serwisem społecznościowym";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
