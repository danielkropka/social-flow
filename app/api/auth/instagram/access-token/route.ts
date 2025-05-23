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

    // Wymiana kodu na user access token
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
    const userAccessToken = data.access_token;

    // 1. Pobierz listę stron użytkownika
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok || !pagesData.data || !Array.isArray(pagesData.data)) {
      return NextResponse.json(
        {
          error: "Nie udało się pobrać stron powiązanych z kontem Facebook.",
          details: pagesData,
          code: "FACEBOOK_API_ERROR",
        },
        { status: 400 }
      );
    }

    // 2. Dla każdej strony sprawdź, czy jest powiązana z IG Business
    let found = false;
    let connectedAccount = null;
    for (const page of pagesData.data) {
      const pageId = page.id;
      const pageAccessToken = page.access_token;
      // Pobierz IG Business Account ID
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igRes.json();
      if (
        igRes.ok &&
        igData.instagram_business_account &&
        igData.instagram_business_account.id
      ) {
        // Zapisz do bazy jako konto IG
        try {
          connectedAccount = await db.connectedAccount.upsert({
            where: {
              provider_providerAccountId_userId: {
                provider: "INSTAGRAM",
                providerAccountId: igData.instagram_business_account.id,
                userId: session.user.id,
              },
            },
            update: {
              accessToken: encryptToken(pageAccessToken),
              expiresAt: null, // Page Access Token nie zawsze ma expiresAt
              username: page.name,
              name: page.name,
              profileImage: page.picture?.data?.url || null,
            },
            create: {
              provider: "INSTAGRAM",
              providerAccountId: igData.instagram_business_account.id,
              accessToken: encryptToken(pageAccessToken),
              expiresAt: null,
              name: page.name,
              username: page.name,
              profileImage: page.picture?.data?.url || null,
              userId: session.user.id,
            },
          });
          found = true;
          break;
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
      }
    }

    if (!found) {
      return NextResponse.json(
        {
          error: "Nie znaleziono powiązanego konta Instagram Business.",
          details:
            "Połącz konto Instagram Business z wybraną stroną na Facebooku.",
          code: "NO_IG_BUSINESS_ACCOUNT",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      account: connectedAccount,
    });
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
