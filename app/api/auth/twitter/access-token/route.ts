import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import crypto from "crypto";
import OAuth from "oauth-1.0a";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

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

    const { token, verifier, tokenSecret } = await request.json();

    if (!token || !verifier || !tokenSecret) {
      return NextResponse.json(
        {
          error: "Brak wymaganych danych",
          details: "Nie otrzymano wszystkich wymaganych danych z Twitter",
        },
        { status: 400 }
      );
    }

    // Inicjalizacja OAuth 1.0a
    const oauth = new OAuth({
      consumer: {
        key: TWITTER_API_KEY,
        secret: TWITTER_API_SECRET,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });

    // Generowanie parametrów OAuth dla access token
    const requestData = {
      url: "https://api.twitter.com/oauth/access_token",
      method: "POST",
      data: {
        oauth_token: token,
        oauth_verifier: verifier,
      },
    };

    const headers = oauth.toHeader(
      oauth.authorize(requestData, {
        key: token,
        secret: tokenSecret,
      })
    );

    // Wymiana kodu na token dostępu
    const tokenResponse = await fetch(requestData.url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Twitter API error:", errorText);
      return NextResponse.json(
        {
          error: "Błąd podczas wymiany kodu na token",
          details: `Błąd API Twitter: ${tokenResponse.status} ${tokenResponse.statusText}`,
        },
        { status: 400 }
      );
    }

    const responseText = await tokenResponse.text();
    const tokenData = Object.fromEntries(new URLSearchParams(responseText));

    if (!tokenData.oauth_token || !tokenData.oauth_token_secret) {
      console.error("Nieprawidłowa odpowiedź z Twitter:", tokenData);
      return NextResponse.json(
        {
          error: "Nieprawidłowa odpowiedź z Twitter API",
          details: "Brak wymaganych danych w odpowiedzi",
        },
        { status: 400 }
      );
    }

    // Generowanie nagłówków dla API v2
    const userInfoHeaders = oauth.toHeader(
      oauth.authorize(
        {
          url: "https://api.twitter.com/2/users/me",
          method: "GET",
          data: {
            "user.fields": "profile_image_url,username,name",
          },
        },
        {
          key: tokenData.oauth_token,
          secret: tokenData.oauth_token_secret,
        }
      )
    );

    // Pobierz informacje o użytkowniku
    const userInfoResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
      {
        headers: {
          ...userInfoHeaders,
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

    if (!userInfo.data?.id) {
      console.error("Nieprawidłowa odpowiedź z Twitter:", userInfo);
      return NextResponse.json(
        {
          error: "Nieprawidłowa odpowiedź z Twitter API",
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
            provider: "TWITTER",
            providerAccountId: userInfo.data.id,
          },
        },
        update: {
          accessToken: tokenData.oauth_token,
          refreshToken: tokenData.oauth_token_secret,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Tokeny OAuth 1.0a nie wygasają
          username: userInfo.data.username,
          profileImage: userInfo.data.profile_image_url,
        },
        create: {
          provider: "TWITTER",
          providerAccountId: userInfo.data.id,
          accessToken: tokenData.oauth_token,
          refreshToken: tokenData.oauth_token_secret,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Tokeny OAuth 1.0a nie wygasają
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
