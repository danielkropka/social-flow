import { NextResponse } from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY!;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET!;
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL!;

export async function GET() {
  try {
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

    const request_data = {
      url: "https://api.x.com/oauth/request_token",
      method: "POST",
      data: {
        oauth_callback: TWITTER_CALLBACK_URL,
      },
    };

    const response = await fetch(request_data.url, {
      method: request_data.method,
      headers: {
        ...oauth.toHeader(oauth.authorize(request_data)),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get request token");
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    const oauth_token = params.get("oauth_token");
    const oauth_token_secret = params.get("oauth_token_secret");

    if (!oauth_token || !oauth_token_secret) {
      throw new Error("Invalid response from Twitter");
    }

    return NextResponse.json({ oauth_token, oauth_token_secret });
  } catch (error) {
    console.error("Error getting Twitter request token:", error);
    return NextResponse.json(
      { error: "Failed to get Twitter request token" },
      { status: 500 }
    );
  }
}
