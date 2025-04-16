import { NextResponse } from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY!;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET!;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 sekunda

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : INITIAL_RETRY_DELAY * Math.pow(2, retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oauth_token, oauth_verifier } = await request.json();

    if (!oauth_token || !oauth_verifier) {
      return NextResponse.json(
        { error: "Missing oauth_token or oauth_verifier" },
        { status: 400 }
      );
    }

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
      url: "https://api.x.com/oauth/access_token",
      method: "POST",
      data: {
        oauth_token,
        oauth_verifier,
      },
    };

    const response = await fetch(request_data.url, {
      method: request_data.method,
      headers: {
        ...oauth.toHeader(oauth.authorize(request_data)),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        oauth_token,
        oauth_verifier,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter API error: ${errorText}`);
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    const access_token = params.get("oauth_token");
    const access_token_secret = params.get("oauth_token_secret");
    const user_id = params.get("user_id");
    const screen_name = params.get("screen_name");

    if (!access_token || !access_token_secret || !user_id || !screen_name) {
      throw new Error("Invalid response from Twitter");
    }

    // Pobierz informacje o użytkowniku używając API v2
    const user_data = {
      url: `https://api.x.com/2/users/${user_id}`,
      method: "GET",
      data: {
        "user.fields": "profile_image_url,name,username",
      },
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(user_data, {
        key: access_token,
        secret: access_token_secret,
      })
    );

    const userResponse = await fetchWithRetry(
      `${user_data.url}?${new URLSearchParams(user_data.data).toString()}`,
      {
        method: user_data.method,
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      if (userResponse.status === 429) {
        return NextResponse.json(
          {
            error: "Przekroczono limit zapytań do Twittera",
            details: "Spróbuj ponownie za kilka minut",
          },
          { status: 429 }
        );
      }
      throw new Error(`Failed to get user info: ${errorText}`);
    }

    const userInfo = await userResponse.json();
    const profileImage = userInfo.data?.profile_image_url?.replace(
      "_normal",
      ""
    );

    // Zapisz konto do bazy danych
    await db.connectedAccount.create({
      data: {
        provider: "TWITTER",
        providerAccountId: user_id,
        accessToken: access_token,
        refreshToken: access_token_secret,
        name: userInfo.data?.name || screen_name,
        username: userInfo.data?.username || screen_name,
        profileImage,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        username: userInfo.data?.username || screen_name,
        name: userInfo.data?.name || screen_name,
        profileImage,
        access_token,
        access_token_secret,
      },
    });
  } catch (error) {
    console.error("Error getting Twitter access token:", error);
    return NextResponse.json(
      {
        error: "Failed to get Twitter access token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
