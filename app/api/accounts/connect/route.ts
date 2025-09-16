import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { Provider } from "@prisma/client";
import { createClient } from "@redis/client";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as Provider | undefined;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany" },
      { status: 401 },
    );
  }

  if (!provider || !Object.values(Provider).includes(provider)) {
    return NextResponse.json(
      { error: "Nieobsługiwany provider" },
      { status: 400 },
    );
  }

  switch (provider) {
    case Provider.TWITTER:
      if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_REDIRECT_URI) {
        return NextResponse.json(
          { error: "Brak konfiguracji Twitter" },
          { status: 500 },
        );
      }

      const oauth = new OAuth({
        consumer: { key: TWITTER_API_KEY, secret: TWITTER_API_SECRET },
        signature_method: "HMAC-SHA1",
        hash_function(baseString: string, key: string) {
          return crypto
            .createHmac("sha1", key)
            .update(baseString)
            .digest("base64");
        },
      });

      const requestOptions = {
        url: "https://api.twitter.com/oauth/request_token",
        method: "POST",
        data: {
          oauth_callback: TWITTER_REDIRECT_URI,
        },
      };

      const requestTokenResponse = await fetch(requestOptions.url, {
        method: requestOptions.method,
        headers: {
          ...oauth.toHeader(oauth.authorize(requestOptions)),
        },
      });

      if (!requestTokenResponse.ok) {
        const errorTxt = await requestTokenResponse.text();
        return NextResponse.json(
          {
            error: "Nie udało się pobrać tokena.",
            details: errorTxt || undefined,
          },
          { status: 500 },
        );
      }

      const requestTokenTxt = await requestTokenResponse.text();
      const requestParams = new URLSearchParams(requestTokenTxt);
      const requestToken = requestParams.get("oauth_token");
      const requestTokenSecret = requestParams.get("oauth_token_secret");
      if (!requestToken || !requestTokenSecret) {
        return NextResponse.json(
          { error: "Brak wymaganych tokenów w odpowiedzi." },
          { status: 500 },
        );
      }

      if (requestParams.get("oauth_callback_confirmed") !== "true") {
        return NextResponse.json(
          { error: "Twitter nie potwierdził poprawnego callbacku." },
          { status: 500 },
        );
      }

      try {
        const client = createClient({
          username: "default",
          password: process.env.REDIS_DATABASE_PASSWORD,
          socket: {
            host: process.env.REDIS_DATABASE_URL,
            port: 11273,
          },
        });

        await client.connect();

        const redisKey = `tw:oauth:req_secret:${session.user.id}:${requestToken}`;
        await client.set(redisKey, requestTokenSecret, { EX: 600, NX: true });

        await client.quit();
      } catch (error) {
        console.log(error);
      }

      return NextResponse.json({
        authUrl:
          "https://api.x.com/oauth/authorize?oauth_token=" + requestToken,
      });
    default:
      return NextResponse.json(
        { error: "Nieobsługiwany provider" },
        { status: 400 },
      );
  }
}
