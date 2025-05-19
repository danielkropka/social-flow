import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/config/auth";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { db } from "@/lib/config/prisma";
import { encryptToken } from "@/lib/utils/utils";
import { withRateLimit } from "@/middleware/rateLimit";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;

export async function GET(req: Request) {
  return withRateLimit(async (req: Request) => {
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
      const oauth = new OAuth({
        consumer: {
          key: TWITTER_API_KEY!,
          secret: TWITTER_API_SECRET!,
        },
        signature_method: "HMAC-SHA1",
        hash_function: (baseString: string, key: string) => {
          return crypto
            .createHmac("sha1", key)
            .update(baseString)
            .digest("base64");
        },
      });

      const requestOptions = {
        url: "https://api.x.com/oauth/request_token",
        method: "POST",
        data: {
          oauth_callback: REDIRECT_URI!,
          oauth_consumer_key: TWITTER_API_KEY!,
        },
      };

      const requestTokenResponse = await fetch(requestOptions.url, {
        method: requestOptions.method,
        headers: {
          ...oauth.toHeader(oauth.authorize(requestOptions)),
        },
      });

      if (!requestTokenResponse.ok) {
        throw new Error("Nie udało się pobrać tokena");
      }

      const requestDataText = await requestTokenResponse.text();
      const requestParams = new URLSearchParams(requestDataText);
      const requestToken = requestParams.get("oauth_token");
      const requestTokenSecret = requestParams.get("oauth_token_secret");

      if (!requestToken || !requestTokenSecret) {
        throw new Error("Brak wymaganych tokenów w odpowiedzi");
      }

      if (requestParams.get("oauth_callback_confirmed") !== "true") {
        throw new Error("Twitter nie potwierdził poprawnego callbacku");
      }

      await db.connectedAccount.create({
        data: {
          userId: session.user.id,
          provider: "TWITTER",
          providerAccountId: "pending",
          accessToken: "pending", // Tymczasowy token
          requestToken: encryptToken(requestToken),
          requestTokenSecret: encryptToken(requestTokenSecret),
          requestTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minut
          name: "Pending Twitter Account",
          username: "pending",
          status: "PENDING",
        },
      });

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
  })(req);
}
