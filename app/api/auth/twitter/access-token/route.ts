import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const REDIRECT_URI = "https://social-flow.pl/twitter-callback";

export async function POST(request: Request) {
  try {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Twitter",
        },
        { status: 401 }
      );
    }

    if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
      console.error("Brak konfiguracji Twitter");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Twitter",
        },
        { status: 500 }
      );
    }

    const { code, code_verifier } = await request.json();

    if (!code || !code_verifier) {
      return NextResponse.json(
        {
          error: "Brak wymaganych danych",
          details: "Nie otrzymano kodu autoryzacji lub code_verifier z Twitter",
        },
        { status: 400 }
      );
    }

    // Wymiana kodu na token dostępu
    const tokenResponse = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: TWITTER_API_KEY,
          redirect_uri: REDIRECT_URI,
          code_verifier,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Twitter API error:", errorData);
      return NextResponse.json(
        {
          error: "Błąd podczas wymiany kodu na token",
          details: errorData.error_description || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Pobierz informacje o użytkowniku
    const userInfoResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error("Twitter User Info error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać informacji o koncie Twitter",
          details: errorData.detail || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();

    try {
      // Zapisz token w bazie danych
      const connectedAccount = await db.connectedAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: "TWITTER",
            providerAccountId: userInfo.data.id,
          },
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          username: userInfo.data.username,
          profileImage: userInfo.data.profile_image_url,
        },
        create: {
          provider: "TWITTER",
          providerAccountId: userInfo.data.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          name: userInfo.data.name,
          username: userInfo.data.username,
          profileImage: userInfo.data.profile_image_url,
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
          error: "Nie udało się zapisać danych konta Twitter",
          details: "Błąd podczas zapisywania w bazie danych",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Błąd autoryzacji Twitter:", error);
    return NextResponse.json(
      {
        error: "Wystąpił nieoczekiwany błąd podczas łączenia z Twitter",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
