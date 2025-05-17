import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;

export async function GET() {
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

  if (!TWITTER_CLIENT_ID) {
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
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        oauth_callback: REDIRECT_URI!,
        oauth_consumer_key: TWITTER_API_KEY!,
      },
    };

    const requestTokenResponse = await fetch(
      "https://api.x.com/oauth/request_token",
      requestOptions
    );

    if (!requestTokenResponse.ok) {
      const errorData = await requestTokenResponse.json();
      console.error("Twitter API error:", errorData);
      return NextResponse.json(
        {
          error: "Nie udało się pobrać tokena",
          details: `Błąd API Twitter: ${requestTokenResponse.status} ${requestTokenResponse.statusText}`,
        },
        { status: 400 }
      );
    }

    const requestTokenData = await requestTokenResponse.json();
    const requestToken = requestTokenData.oauth_token;
    const requestTokenSecret = requestTokenData.oauth_token_secret;

    if (requestTokenData.oauth_callback_confirmed !== "true") {
      return NextResponse.json(
        {
          error: "Twitter nie potwierdził poprawnego callbacku",
        },
        { status: 400 }
      );
    }

    // Zapisz tokeny w sesji
    session.twitterRequestToken = requestToken;
    session.twitterRequestTokenSecret = requestTokenSecret;

    return NextResponse.json({
      authUrl: `https://api.x.com/oauth/authorize?oauth_token=${requestToken}`,
    });
  } catch (err) {
    console.error("Błąd podczas generowania URL autoryzacji Twitter:", err);
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować linku autoryzacji",
        details: err instanceof Error ? err.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
