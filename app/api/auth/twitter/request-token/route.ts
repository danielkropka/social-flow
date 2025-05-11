import { NextResponse } from "next/server";
import crypto from "crypto";
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

    // Generuj code_verifier i code_challenge dla PKCE
    const code_verifier = crypto.randomBytes(32).toString("base64url");
    const code_challenge = crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64url");

    // Wymagane uprawnienia dla Twitter API v2
    const scopes = [
      "tweet.read", // Odczyt tweetów
      "tweet.write", // Publikowanie tweetów
      "users.read", // Odczyt informacji o użytkownikach
      "offline.access", // Dostęp offline (refresh token)
    ].join(" ");

    const state = crypto.randomBytes(32).toString("hex");
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_API_KEY}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;

    return NextResponse.json({
      authUrl,
      state,
      code_verifier, // Zwracamy code_verifier, które będzie potrzebne przy wymianie kodu na token
    });
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
