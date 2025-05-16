import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import crypto from "crypto";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const REDIRECT_URI =
  process.env.TWITTER_REDIRECT_URI || "https://social-flow.pl/twitter-callback";

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
      // Generowanie URL do autoryzacji OAuth 2.0
      const { codeVerifier, codeChallenge } = generateCodeChallenge();

      // Zapisz code_verifier w sesji lub bazie danych
      // TODO: Zapisz code_verifier w bazie danych powiązany z użytkownikiem

      const authUrl =
        `https://twitter.com/i/oauth2/authorize?` +
        new URLSearchParams({
          client_id: TWITTER_CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          response_type: "code",
          scope: "tweet.read tweet.write users.read offline.access",
          code_challenge_method: "S256",
          code_challenge: codeChallenge,
          state: crypto.randomBytes(32).toString("hex"),
        });

      return NextResponse.json({
        authUrl,
        codeVerifier, // TODO: Usuń to po implementacji zapisywania w bazie danych
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

function generateCodeVerifier() {
  const validChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const length = Math.floor(Math.random() * (128 - 43 + 1)) + 43;
  let codeVerifier = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * validChars.length);
    codeVerifier += validChars[randomIndex];
  }

  return codeVerifier;
}

function generateCodeChallenge() {
  const codeVerifier = generateCodeVerifier();
  const hash = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64");
  const codeChallenge = hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return {
    codeVerifier,
    codeChallenge,
  };
}
