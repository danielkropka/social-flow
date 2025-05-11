import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
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

    if (!TWITTER_API_KEY) {
      console.error("Brak konfiguracji Twitter API_KEY");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Twitter",
        },
        { status: 500 }
      );
    }

    try {
      const response = await fetch(
        `https://api.x.com/oauth/request_token?oauth_consumer_key=${TWITTER_API_KEY}&oauth_callback=${REDIRECT_URI}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Nie udało się pobrać tokena");
      }

      const data = await response.json();

      return NextResponse.json({
        token: data.oauth_token,
        tokenSecret: data.oauth_token_secret,
        callbackConfirmed: data.oauth_callback_confirmed,
      });
    } catch (error) {
      console.error("Błąd podczas generowania URL autoryzacji Twitter:", error);
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
