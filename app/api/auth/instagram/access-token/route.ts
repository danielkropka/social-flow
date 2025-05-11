import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = "https://social-flow-flame.vercel.app/instagram-callback";

export async function POST(request: Request) {
  try {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Instagram",
        },
        { status: 401 }
      );
    }

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      console.error("Brak konfiguracji Instagram");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Instagram",
        },
        { status: 500 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          error: "Brak kodu autoryzacji",
          details: "Nie otrzymano kodu autoryzacji z Instagram",
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
          error: "Błąd podczas wymiany kodu na token",
          details: errorData,
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
          error: "Błąd podczas pobierania długoterminowego tokenu",
          details: errorData,
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
          error: "Nie udało się pobrać informacji o koncie Instagram",
          details: errorData.error?.message || "Nieznany błąd",
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
          error: "Nie udało się pobrać informacji o typie konta Instagram",
          details: errorData.error?.message || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const accountInfo = await accountInfoResponse.json();

    // Sprawdź czy konto jest firmowe lub twórcy
    if (
      accountInfo.account_type !== "MEDIA_BUSINESS" &&
      accountInfo.account_type !== "MEDIA_CREATOR"
    ) {
      return NextResponse.json(
        {
          error: "Nieprawidłowy typ konta Instagram",
          details: `Twoje konto musi być kontem firmowym lub twórcy. Aktualny typ konta: ${accountInfo.account_type}`,
        },
        { status: 400 }
      );
    }

    try {
      // Zapisz token w bazie danych
      const connectedAccount = await prisma.connectedAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: "INSTAGRAM",
            providerAccountId: userInfo.id,
          },
        },
        update: {
          accessToken: longLivedTokenData.access_token,
          expiresAt: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          username: userInfo.username,
          profileImage: userInfo.profile_picture_url,
        },
        create: {
          provider: "INSTAGRAM",
          providerAccountId: userInfo.id,
          accessToken: longLivedTokenData.access_token,
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
          error: "Nie udało się zapisać danych konta Instagram",
          details: "Błąd podczas zapisywania w bazie danych",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Błąd autoryzacji Instagram:", error);
    return NextResponse.json(
      {
        error: "Wystąpił nieoczekiwany błąd podczas łączenia z Instagram",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
