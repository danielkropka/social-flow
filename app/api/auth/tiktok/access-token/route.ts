import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = "https://social-flow.pl/tiktok-callback/";

export async function POST(request: Request) {
  try {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto TikTok",
        },
        { status: 401 }
      );
    }

    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      console.error("Brak konfiguracji TikTok");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji TikTok",
        },
        { status: 500 }
      );
    }

    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json(
        {
          error: "Brak wymaganych danych",
          details: "Nie otrzymano kodu autoryzacji lub state z TikTok",
        },
        { status: 400 }
      );
    }

    // Sprawdź czy state zgadza się z tym w cookies
    const cookieStore = await cookies();
    const savedState = cookieStore.get("csrfState");

    if (!savedState?.value || savedState.value !== state) {
      console.error("Nieprawidłowy state:", {
        received: state,
        saved: savedState?.value,
      });
      return NextResponse.json(
        {
          error: "Nieprawidłowy state",
          details: "Weryfikacja bezpieczeństwa nie powiodła się",
        },
        { status: 400 }
      );
    }

    // Usuń cookie po weryfikacji
    const response = NextResponse.json({ success: true });
    response.cookies.delete("csrfState");

    // Wymiana kodu na token dostępu
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("TikTok API error:", errorData);
      return NextResponse.json(
        {
          error: "Błąd podczas wymiany kodu na token",
          details: errorData.message || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Pobierz informacje o użytkowniku
    const userInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username,avatar_url",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error("TikTok User Info error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać informacji o koncie TikTok",
          details: errorData.message || "Nieznany błąd",
        },
        { status: 400 }
      );
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo.data?.user?.open_id) {
      console.error("Brak open_id w odpowiedzi:", userInfo);
      return NextResponse.json(
        {
          error: "Nieprawidłowa odpowiedź z TikTok",
          details: "Brak wymaganych danych użytkownika",
        },
        { status: 400 }
      );
    }

    try {
      // Zapisz token w bazie danych
      const connectedAccount = await db.connectedAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: "TIKTOK",
            providerAccountId: userInfo.data.user.open_id,
          },
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          username: userInfo.data.user.username,
          profileImage: userInfo.data.user.avatar_url,
        },
        create: {
          provider: "TIKTOK",
          providerAccountId: userInfo.data.user.open_id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          name: userInfo.data.user.display_name,
          username: userInfo.data.user.username,
          profileImage: userInfo.data.user.avatar_url,
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
          error: "Nie udało się zapisać danych konta TikTok",
          details: "Błąd podczas zapisywania w bazie danych",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Błąd autoryzacji TikTok:", error);
    return NextResponse.json(
      {
        error: "Wystąpił nieoczekiwany błąd podczas łączenia z TikTok",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
