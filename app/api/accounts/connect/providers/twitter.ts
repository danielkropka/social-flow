import { NextResponse } from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { Redis } from "@upstash/redis";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

export async function handleTwitterConnect(userId: string) {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_REDIRECT_URI) {
    return NextResponse.json({ error: "NoEnvConfiguration" }, { status: 500 });
  }

  const oauth = new OAuth({
    consumer: { key: TWITTER_API_KEY, secret: TWITTER_API_SECRET },
    signature_method: "HMAC-SHA1",
    hash_function(baseString: string, key: string) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  if (!oauth) throw new Error("NoOAuth");

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
        error: "NoToken",
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
    return NextResponse.json({ error: "NoToken" }, { status: 500 });
  }

  if (requestParams.get("oauth_callback_confirmed") !== "true") {
    return NextResponse.json({ error: "NoCallbackConfirmed" }, { status: 500 });
  }

  try {
    const client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    if (!client) throw new Error("NoRedisClient");

    const redisKey = `tw:oauth:req_secret:${userId}:${requestToken}`;
    await client.set(redisKey, requestTokenSecret, { ex: 600, nx: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "NoRedisClient":
          return NextResponse.json(
            {
              error: "Wystąpił błąd w trakcie integracji zewnętrznego serwera.",
            },
            { status: 500 },
          );
        case "NoOAuth":
          return NextResponse.json(
            { error: "Wystąpił błąd w trakcie tworzenia klasy OAuth." },
            { status: 500 },
          );
        case "NoCallbackConfirmed":
          return NextResponse.json(
            {
              error:
                "Twitter nie potwierdził adresu zwrotnego. Zgłoś błąd do administratora aplikacji.",
            },
            { status: 500 },
          );
        default:
          return NextResponse.json(
            {
              error:
                "Wystąpił nieznany błąd w trakcie autoryzacji. Spróbuj ponownie później",
            },
            { status: 500 },
          );
      }
    }

    return NextResponse.json(
      {
        error:
          "Wystąpił nieznany błąd w trakcie autoryzacji. Spróbuj ponownie później",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    authUrl: "https://api.x.com/oauth/authorize?oauth_token=" + requestToken,
  });
}
