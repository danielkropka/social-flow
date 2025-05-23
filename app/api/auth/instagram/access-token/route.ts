import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { encryptToken } from "@/lib/utils/utils";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = "https://social-flow.pl/instagram-callback";

export async function POST(request: Request) {
  try {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Instagram.",
          code: "NOT_LOGGED_IN",
        },
        { status: 401 }
      );
    }

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      console.error("Brak konfiguracji Instagram");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji aplikacji Instagram.",
          details: "Skontaktuj się z pomocą techniczną.",
          code: "CONFIG_ERROR",
        },
        { status: 500 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          error: "Brak kodu autoryzacji.",
          details: "Nie otrzymano kodu autoryzacji z Instagram.",
          code: "MISSING_CODE",
        },
        { status: 400 }
      );
    }

    // Wymiana kodu na token dostępu
    const formData = new URLSearchParams();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", INSTAGRAM_APP_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", REDIRECT_URI);
    formData.append("code", code);

    const response = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Instagram API error:", errorData);
      return NextResponse.json(
        {
          error: "Błąd połączenia z Instagram.",
          details: "Nie udało się wymienić kodu na token. Spróbuj ponownie.",
          code: "INSTAGRAM_API_ERROR",
        },
        { status: 400 }
      );
    }

    const data = await response.json();

    // Pobierz długoterminowy token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${data.access_token}`
    );

    if (!longLivedTokenResponse.ok) {
      const errorData = await longLivedTokenResponse.text();
      console.error("Instagram Long-lived token error:", errorData);
      return NextResponse.json(
        {
          error: "Błąd połączenia z Instagram.",
          details: "Nie udało się pobrać długoterminowego tokenu.",
          code: "INSTAGRAM_API_ERROR",
        },
        { status: 400 }
      );
    }

    const longLivedTokenData = await longLivedTokenResponse.json();

    // Pobierz informacje o koncie Instagram
    const userInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${data.access_token}`
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error("Instagram User Info error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać informacji o koncie Instagram.",
          details: "Spróbuj ponownie lub skontaktuj się z pomocą techniczną.",
          code: "INSTAGRAM_API_ERROR",
        },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();

    // Sprawdź czy konto jest firmowe lub twórcy
    const accountInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url,account_type&access_token=${data.access_token}`
    );

    if (!accountInfoResponse.ok) {
      const errorData = await accountInfoResponse.json();
      console.error("Instagram Account Info error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać typu konta Instagram.",
          details: "Spróbuj ponownie lub skontaktuj się z pomocą techniczną.",
          code: "INSTAGRAM_API_ERROR",
        },
        { status: 400 }
      );
    }

    const accountInfo = await accountInfoResponse.json();

    // Sprawdź czy konto jest firmowe lub twórcy
    if (
      accountInfo.account_type !== "BUSINESS" &&
      accountInfo.account_type !== "CREATOR"
    ) {
      return NextResponse.json(
        {
          error: "Nieprawidłowy typ konta Instagram.",
          details: "Twoje konto musi być kontem firmowym lub twórcy.",
          code: "INVALID_ACCOUNT_TYPE",
        },
        { status: 400 }
      );
    }

    try {
      // Zapisz token w bazie danych
      const connectedAccount = await db.connectedAccount.upsert({
        where: {
          provider_providerAccountId_userId: {
            provider: "INSTAGRAM",
            providerAccountId: userInfo.id,
            userId: session.user.id,
          },
        },
        update: {
          accessToken: encryptToken(longLivedTokenData.access_token),
          expiresAt: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          username: userInfo.username,
          profileImage: userInfo.profile_picture_url,
        },
        create: {
          provider: "INSTAGRAM",
          providerAccountId: userInfo.id,
          accessToken: encryptToken(longLivedTokenData.access_token),
          expiresAt: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          name: userInfo.username,
          username: userInfo.username,
          profileImage: userInfo.profile_picture_url,
          userId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        account: connectedAccount,
      });
    } catch (dbError) {
      console.error("Błąd bazy danych:", dbError);
      return NextResponse.json(
        {
          error: "Nie udało się zapisać danych konta Instagram.",
          details:
            "Wystąpił błąd po stronie serwera. Spróbuj ponownie później.",
          code: "DB_ERROR",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Błąd autoryzacji Instagram:", error);
    return NextResponse.json(
      {
        error: "Wystąpił nieoczekiwany błąd podczas łączenia z Instagram.",
        details:
          "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
