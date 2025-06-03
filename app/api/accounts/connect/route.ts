import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { encryptToken, decryptToken } from "@/lib/utils/utils";
import { cookies } from "next/headers";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

// Typy pomocnicze
interface ConnectRequestBody {
  provider: "facebook" | "instagram" | "tiktok" | "twitter";
  code?: string;
  state?: string;
  oauth_token?: string;
  oauth_verifier?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany" },
      { status: 401 }
    );
  }
  if (!provider) {
    return NextResponse.json(
      { error: "Brak parametru provider" },
      { status: 400 }
    );
  }
  if (provider === "facebook") {
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "pages_manage_metadata",
      "public_profile",
      "email",
    ].join(",");
    const state = crypto.randomBytes(32).toString("hex");
    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&state=${state}&scope=${scopes}`;
    return NextResponse.json({ authUrl });
  }
  if (provider === "instagram") {
    const scopes = [
      "instagram_business_basic",
      "instagram_business_content_publish",
    ].join(",");
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=${scopes}&response_type=code`;
    return NextResponse.json({ authUrl });
  }
  if (provider === "tiktok") {
    const state = crypto.randomBytes(32).toString("hex");
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&response_type=code&scope=${[
      "user.info.basic",
      "user.info.stats",
      "user.info.profile",
    ].join(",")}&redirect_uri=${TIKTOK_REDIRECT_URI}&state=${state}`;
    const response = NextResponse.json({ authUrl, state });
    response.cookies.set("csrfState", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });
    return response;
  }
  if (provider === "twitter") {
    if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_REDIRECT_URI) {
      return NextResponse.json(
        { error: "Brak konfiguracji Twitter" },
        { status: 500 }
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
      url: "https://api.x.com/oauth/request_token",
      method: "POST",
      data: {
        oauth_callback: TWITTER_REDIRECT_URI,
        oauth_consumer_key: TWITTER_API_KEY,
      },
    };
    const requestTokenResponse = await fetch(requestOptions.url, {
      method: requestOptions.method,
      headers: {
        ...oauth.toHeader(oauth.authorize(requestOptions)),
      },
    });
    console.log(requestTokenResponse);
    console.log(requestOptions);
    if (!requestTokenResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać tokena" },
        { status: 500 }
      );
    }
    const requestDataText = await requestTokenResponse.text();
    const requestParams = new URLSearchParams(requestDataText);
    const requestToken = requestParams.get("oauth_token");
    const requestTokenSecret = requestParams.get("oauth_token_secret");
    if (!requestToken || !requestTokenSecret) {
      return NextResponse.json(
        { error: "Brak wymaganych tokenów w odpowiedzi" },
        { status: 500 }
      );
    }
    if (requestParams.get("oauth_callback_confirmed") !== "true") {
      return NextResponse.json(
        { error: "Twitter nie potwierdził poprawnego callbacku" },
        { status: 500 }
      );
    }
    await db.connectedAccount.create({
      data: {
        userId: session.user.id,
        provider: "TWITTER",
        providerAccountId: "pending",
        accessToken: "pending",
        requestToken: encryptToken(requestToken),
        requestTokenSecret: encryptToken(requestTokenSecret),
        requestTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        name: "Pending Twitter Account",
        username: "pending",
        status: "PENDING",
      },
    });
    return NextResponse.json({
      authUrl: `https://api.x.com/oauth/authorize?oauth_token=${requestToken}`,
    });
  }
  return NextResponse.json(
    { error: "Nieobsługiwany provider" },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ConnectRequestBody;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany" },
      { status: 401 }
    );
  }
  if (!body.provider) {
    return NextResponse.json(
      { error: "Brak parametru provider" },
      { status: 400 }
    );
  }
  // FACEBOOK
  if (body.provider === "facebook") {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_REDIRECT_URI) {
      return NextResponse.json(
        { error: "Brak konfiguracji Facebook" },
        { status: 500 }
      );
    }
    if (!body.code) {
      return NextResponse.json(
        { error: "Brak kodu autoryzacji" },
        { status: 400 }
      );
    }
    // Wymiana kodu na token dostępu
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${body.code}`
    );
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Błąd podczas wymiany kodu na token" },
        { status: 400 }
      );
    }
    const tokenData = await tokenResponse.json();
    // Pobierz długoterminowy token
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    if (!longLivedTokenResponse.ok) {
      return NextResponse.json(
        { error: "Błąd podczas pobierania długoterminowego tokenu" },
        { status: 400 }
      );
    }
    const longLivedTokenData = await longLivedTokenResponse.json();
    // Pobierz informacje o użytkowniku
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
    );
    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać informacji o koncie Facebook" },
        { status: 400 }
      );
    }
    const userInfo = await userInfoResponse.json();
    // Pobierz listę stron użytkownika
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v22.0/me/accounts?access_token=${tokenData.access_token}`
    );
    if (!pagesResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać listy stron Facebook" },
        { status: 400 }
      );
    }
    const pagesData = await pagesResponse.json();
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json(
        { error: "Brak stron Facebook" },
        { status: 400 }
      );
    }
    const connectedAccount = await db.connectedAccount.upsert({
      where: {
        provider_providerAccountId_userId: {
          provider: "FACEBOOK",
          providerAccountId: userInfo.id,
          userId: session.user.id,
        },
      },
      update: {
        accessToken: longLivedTokenData.access_token,
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        username: userInfo.name,
        profileImage: userInfo.picture?.data?.url,
      },
      create: {
        provider: "FACEBOOK",
        providerAccountId: userInfo.id,
        accessToken: longLivedTokenData.access_token,
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        name: userInfo.name,
        username: userInfo.name,
        profileImage: userInfo.picture?.data?.url,
        userId: session.user.id,
      },
    });
    return NextResponse.json({ success: true, account: connectedAccount });
  }
  // INSTAGRAM
  if (body.provider === "instagram") {
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !INSTAGRAM_REDIRECT_URI) {
      return NextResponse.json(
        { error: "Brak konfiguracji Instagram" },
        { status: 500 }
      );
    }
    if (!body.code) {
      return NextResponse.json(
        { error: "Brak kodu autoryzacji" },
        { status: 400 }
      );
    }
    const formData = new URLSearchParams();
    formData.append("client_id", INSTAGRAM_APP_ID);
    formData.append("client_secret", INSTAGRAM_APP_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", INSTAGRAM_REDIRECT_URI);
    formData.append("code", body.code);
    const response = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Błąd połączenia z Instagram" },
        { status: 400 }
      );
    }
    const data = await response.json();
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${data.access_token}`
    );
    if (!longLivedTokenResponse.ok) {
      return NextResponse.json(
        { error: "Błąd połączenia z Instagram (long token)" },
        { status: 400 }
      );
    }
    const longLivedTokenData = await longLivedTokenResponse.json();
    const userInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,followers_count,media_count,profile_picture_url&access_token=${longLivedTokenData.access_token}`
    );
    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać informacji o koncie Instagram" },
        { status: 400 }
      );
    }
    const userInfo = await userInfoResponse.json();
    const connectedAccount = await db.connectedAccount.upsert({
      where: {
        provider_providerAccountId_userId: {
          provider: "INSTAGRAM",
          providerAccountId: userInfo.id,
          userId: session.user.id,
        },
      },
      update: {
        accessToken: encryptToken(longLivedTokenData.access_token),
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        username: userInfo.username,
        profileImage: userInfo.profile_picture_url,
        name: userInfo.name,
        followersCount: userInfo.followers_count,
        postsCount: userInfo.media_count,
      },
      create: {
        provider: "INSTAGRAM",
        providerAccountId: userInfo.id,
        accessToken: encryptToken(longLivedTokenData.access_token),
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        name: userInfo.name,
        username: userInfo.username,
        profileImage: userInfo.profile_picture_url,
        userId: session.user.id,
        followersCount: userInfo.followers_count,
        postsCount: userInfo.media_count,
      },
    });
    return NextResponse.json({
      success: true,
      account: {
        name: connectedAccount.name,
        username: connectedAccount.username,
      },
    });
  }
  // TIKTOK
  if (body.provider === "tiktok") {
    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !TIKTOK_REDIRECT_URI) {
      return NextResponse.json(
        { error: "Brak konfiguracji TikTok" },
        { status: 500 }
      );
    }
    if (!body.code || !body.state) {
      return NextResponse.json(
        { error: "Brak wymaganych danych" },
        { status: 400 }
      );
    }
    const cookieStore = await cookies();
    const savedState = cookieStore.get("csrfState");
    if (!savedState?.value || savedState.value !== body.state) {
      return NextResponse.json(
        { error: "Nieprawidłowy state" },
        { status: 400 }
      );
    }
    const response = NextResponse.json({ success: true });
    response.cookies.delete("csrfState");
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code: body.code,
          grant_type: "authorization_code",
          redirect_uri: TIKTOK_REDIRECT_URI,
        }),
      }
    );
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Błąd podczas wymiany kodu na token" },
        { status: 400 }
      );
    }
    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username,avatar_url",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );
    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać informacji o koncie TikTok" },
        { status: 400 }
      );
    }
    const userInfo = await userInfoResponse.json();
    if (!userInfo.data?.user?.open_id) {
      return NextResponse.json(
        { error: "Brak open_id w odpowiedzi" },
        { status: 400 }
      );
    }
    const connectedAccount = await db.connectedAccount.upsert({
      where: {
        provider_providerAccountId_userId: {
          provider: "TIKTOK",
          providerAccountId: userInfo.data.user.open_id,
          userId: session.user.id,
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        username: userInfo.data.user.username,
        profileImage: userInfo.data.user.avatar_url,
      },
      create: {
        provider: "TIKTOK",
        providerAccountId: userInfo.data.user.open_id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        name: userInfo.data.user.display_name,
        username: userInfo.data.user.username,
        profileImage: userInfo.data.user.avatar_url,
        userId: session.user.id,
      },
    });
    return NextResponse.json({ success: true, account: connectedAccount });
  }
  // TWITTER
  if (body.provider === "twitter") {
    if (!body.oauth_token || !body.oauth_verifier) {
      return NextResponse.json(
        { error: "Brak wymaganych danych" },
        { status: 400 }
      );
    }
    const requestToken = await db.connectedAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "TWITTER",
        status: "PENDING",
        requestTokenExpiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (
      !requestToken ||
      decryptToken(requestToken.requestToken!) !== body.oauth_token
    ) {
      return NextResponse.json(
        { error: "Nieprawidłowy lub wygasły token żądania" },
        { status: 400 }
      );
    }
    const requestOptions = {
      oauth_token: body.oauth_token,
      oauth_verifier: body.oauth_verifier,
    };
    const accessTokenResponse = await fetch(
      "https://api.x.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(requestOptions),
      }
    );
    if (!accessTokenResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się przydzielić tokenu" },
        { status: 400 }
      );
    }
    const accessTokenText = await accessTokenResponse.text();
    const accessTokenParams = new URLSearchParams(accessTokenText);
    const accessToken = accessTokenParams.get("oauth_token");
    const accessTokenSecret = accessTokenParams.get("oauth_token_secret");
    if (!accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: "Brak wymaganych tokenów w odpowiedzi" },
        { status: 400 }
      );
    }
    const fields = ["profile_image_url", "username", "name", "public_metrics"];
    const oauth = new OAuth({
      consumer: { key: TWITTER_API_KEY!, secret: TWITTER_API_SECRET! },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });
    const requestData = {
      url: `https://api.x.com/2/users/me?user.fields=${fields.join(",")}`,
      method: "GET",
    };
    const authorization = oauth.authorize(requestData, {
      key: accessToken,
      secret: accessTokenSecret,
    });
    const userResponse = await fetch(requestData.url, {
      headers: {
        Authorization: oauth.toHeader(authorization).Authorization,
      },
    });
    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać danych użytkownika" },
        { status: 400 }
      );
    }
    const userData = await userResponse.json();
    const account = userData.data;
    await db.connectedAccount.delete({ where: { id: requestToken.id } });
    const connectedAccount = await db.connectedAccount.create({
      data: {
        userId: session.user.id,
        provider: "TWITTER",
        providerAccountId: account.id,
        accessToken: encryptToken(accessToken),
        accessTokenSecret: encryptToken(accessTokenSecret),
        profileImage: account.profile_image_url,
        username: account.username,
        name: account.name,
        status: "ACTIVE",
        followersCount: account.public_metrics.followers_count,
        postsCount: account.public_metrics.tweet_count,
        lastStatsUpdate: new Date(),
      },
    });
    return NextResponse.json({ success: true, account: connectedAccount });
  }
  return NextResponse.json(
    { error: "Nieobsługiwany provider" },
    { status: 400 }
  );
}
