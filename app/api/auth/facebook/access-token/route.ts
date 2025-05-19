import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = "https://social-flow.pl/facebook-callback";

export async function POST(request: Request) {
  try {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Facebook",
        },
        { status: 401 }
      );
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Brak konfiguracji Facebook");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Facebook",
        },
        { status: 500 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          error: "Brak kodu autoryzacji",
          details: "Nie otrzymano kodu autoryzacji z Facebook",
        },
        { status: 400 }
      );
    }

    // Wymiana kodu na token dostępu
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Facebook API error:", errorData);
      return NextResponse.json(
        {
          error: "Błąd podczas wymiany kodu na token",
          details: errorData.error?.message || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Pobierz długoterminowy token
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );

    if (!longLivedTokenResponse.ok) {
      const errorData = await longLivedTokenResponse.json();
      console.error("Facebook Long-lived token error:", errorData);
      return NextResponse.json(
        {
          error: "Błąd podczas pobierania długoterminowego tokenu",
          details: errorData.error?.message || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const longLivedTokenData = await longLivedTokenResponse.json();

    // Pobierz informacje o użytkowniku
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error("Facebook User Info error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać informacji o koncie Facebook",
          details: errorData.error?.message || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();

    // Pobierz listę stron użytkownika
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v22.0/me/accounts?access_token=${tokenData.access_token}`
    );

    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json();
      console.error("Facebook Pages error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać listy stron Facebook",
          details:
            "Upewnij się, że masz utworzoną stronę na Facebooku i masz do niej dostęp",
        },
        { status: 400 }
      );
    }

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json(
        {
          error: "Brak stron Facebook",
          details:
            "Nie znaleziono żadnych stron Facebook powiązanych z Twoim kontem. Utwórz stronę na Facebooku przed połączeniem konta.",
        },
        { status: 400 }
      );
    }

    try {
      // Zapisz token w bazie danych
      const connectedAccount = await db.connectedAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: "FACEBOOK",
            providerAccountId: userInfo.id,
          },
        },
        update: {
          accessToken: longLivedTokenData.access_token,
          expiresAt: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          username: userInfo.name,
          profileImage: userInfo.picture?.data?.url,
        },
        create: {
          provider: "FACEBOOK",
          providerAccountId: userInfo.id,
          accessToken: longLivedTokenData.access_token,
          expiresAt: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          name: userInfo.name,
          username: userInfo.name,
          profileImage: userInfo.picture?.data?.url,
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
          error: "Nie udało się zapisać danych konta Facebook",
          details: "Błąd podczas zapisywania w bazie danych",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Błąd autoryzacji Facebook:", error);
    return NextResponse.json(
      {
        error: "Wystąpił nieoczekiwany błąd podczas łączenia z Facebook",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
