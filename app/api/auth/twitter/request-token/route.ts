import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import crypto from "crypto";
import OAuth from "oauth-1.0a";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const REDIRECT_URI = "https://social-flow.pl/twitter-callback";

export async function GET() {
  try {
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
      console.error("Brak konfiguracji Twitter API");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Twitter",
        },
        { status: 500 }
      );
    }

    try {
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

      // Generowanie parametrów OAuth
      const requestData = {
        url: "https://api.twitter.com/oauth/request_token",
        method: "POST",
        data: { oauth_callback: REDIRECT_URI },
      };

      const headers = oauth.toHeader(oauth.authorize(requestData));

      // Wykonanie żądania
      const response = await fetch(requestData.url, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Błąd API Twitter:", errorData);
        throw new Error(
          `Błąd API Twitter: ${response.status} ${response.statusText}`
        );
      }

      const responseText = await response.text();
      const data = Object.fromEntries(new URLSearchParams(responseText));

      if (!data.oauth_token || !data.oauth_token_secret) {
        console.error("Nieprawidłowa odpowiedź z Twitter:", data);
        throw new Error("Nieprawidłowa odpowiedź z Twitter API");
      }

      return NextResponse.json({
        token: data.oauth_token,
        tokenSecret: data.oauth_token_secret,
        callbackConfirmed: data.oauth_callback_confirmed === "true",
      });
    } catch (error) {
      console.error("Błąd podczas generowania tokena Twitter:", error);
      return NextResponse.json(
        {
          error: "Nie udało się wygenerować tokena autoryzacji",
          details: error instanceof Error ? error.message : "Nieznany błąd",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji Twitter:", error);
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować linku autoryzacji",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
