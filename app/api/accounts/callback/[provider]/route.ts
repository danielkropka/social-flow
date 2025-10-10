import { AccountStatus, Provider } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/config/prisma";
import { Redis } from "@upstash/redis";
import { encryptToken } from "@/lib/utils/utils";

const DASHBOARD_REDIRECT = "/dashboard?tab=accounts";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const provider = (await params).provider.toUpperCase() as Provider;
  if (!provider || !Object.values(Provider).includes(provider)) {
    return NextResponse.redirect(
      new URL(`${DASHBOARD_REDIRECT}&error=unsupported_provider`, url),
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany" },
      { status: 401 },
    );
  }

  switch (provider) {
    case Provider.TWITTER:
      const denied = searchParams.get("denied");
      if (denied)
        return NextResponse.redirect(
          new URL(`${DASHBOARD_REDIRECT}?error=connect_denied`, url),
        );

      const oauth_token = searchParams.get("oauth_token");
      const oauth_verifier = searchParams.get("oauth_verifier");
      if (!oauth_token || !oauth_verifier)
        return NextResponse.redirect(
          new URL(`${DASHBOARD_REDIRECT}?error=missing_params`, url),
        );

      const client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const redisKey = `tw:oauth:req_secret:${session.user.id}:${oauth_token}`;
      const requestTokenSecret = await client.get(redisKey);

      if (!requestTokenSecret) {
        return NextResponse.redirect(
          new URL(`${DASHBOARD_REDIRECT}?error=session_expired`, url),
        );
      }

      await client.del(redisKey);

      const oauth = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: oauth_token,
        accessSecret: requestTokenSecret as string,
      });

      const { accessToken, accessSecret, screenName, userId } =
        await oauth.login(oauth_verifier);

      const authed = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken,
        accessSecret,
      });

      const me = await authed.v1.verifyCredentials();
      const avatar =
        me.profile_image_url_https?.replace("_normal", "") ?? undefined;
      const name = me.name ?? screenName ?? "Twitter User";
      const username = me.screen_name ?? screenName ?? "";
      const profileUrl = username
        ? `https://twitter.com/${username}`
        : undefined;

      await db.connectedAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId: userId,
          },
        },
        update: {
          accessToken: encryptToken(accessToken),
          accessSecret: encryptToken(accessSecret),
          oauthVersion: "OAUTH1",
          displayName: name ?? undefined,
          username: username ?? undefined,
          profileImageUrl: avatar ?? undefined,
          profileUrl: avatar ?? undefined,
          lastSyncedAt: new Date(),
          status: AccountStatus.ACTIVE,
          lastErrorAt: null,
          lastErrorMessage: null,
        },
        create: {
          userId: session.user.id,
          provider,
          providerAccountId: userId,
          accessToken: encryptToken(accessToken),
          accessSecret: encryptToken(accessSecret),
          oauthVersion: "OAUTH1",
          oauthTokenSecret: null,
          displayName: name ?? undefined,
          username: username ?? undefined,
          profileImageUrl: avatar ?? undefined,
          profileUrl: profileUrl ?? undefined,
        },
      });
      return NextResponse.redirect(
        new URL(`${DASHBOARD_REDIRECT}&connected=${provider}`, url),
      );

    case Provider.INSTAGRAM:
      try {
        console.log(
          `[INSTAGRAM] Callback started for user: ${session.user.id}`,
        );

        const APP_ID = process.env.INSTAGRAM_APP_ID;
        const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
        const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

        if (!APP_ID || !APP_SECRET || !REDIRECT_URI) {
          console.error("[INSTAGRAM] Missing environment variables");
          throw new Error("NoEnvConfiguration");
        }

        const error = searchParams.get("error");
        if (error) {
          console.error(`[INSTAGRAM] OAuth error: ${error}`);
          switch (error) {
            case "access_denied":
              throw new Error("AccessDenied");
            default:
              throw new Error(`OAuthError: ${error}`);
          }
        }

        const code = searchParams.get("code");
        if (!code) {
          console.error("[INSTAGRAM] No authorization code received");
          throw new Error("NoCode");
        }

        console.log(`[INSTAGRAM] Received code: ${code.substring(0, 10)}...`);

        // Exchange code for short-lived access token
        const requestShortToken = await fetch(
          `https://api.instagram.com/oauth/access_token`,
          {
            method: "POST",
            body: new URLSearchParams({
              client_id: APP_ID,
              client_secret: APP_SECRET,
              grant_type: "authorization_code",
              redirect_uri: REDIRECT_URI,
              code,
            }),
          },
        );

        if (!requestShortToken.ok) {
          const { error_type, error_message } = await requestShortToken.json();
          throw new Error(error_type, { cause: error_message });
        }

        const responseShortToken = await requestShortToken.json();
        const { access_token, user_id, permissions } =
          responseShortToken.data[0];

        const responseLongToken = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${access_token}`,
        );

        if (!responseLongToken.ok) {
          const { error_type, error_message } = await responseLongToken.json();
          throw new Error(error_type, { cause: error_message });
        }

        const {
          access_token: longToken,
          expires_in,
          token_type,
        } = await responseLongToken.json();

        const fields = [
          "followers_count",
          "follows_count",
          "name",
          "username",
          "profile_picture_url",
        ];
        const responseMe = await fetch(
          `https://graph.instagram.com/${user_id}?fields=${fields.join(",")}`,
        );

        if (!responseMe.ok) {
          const { error } = await responseMe.json();
          throw new Error(error.message);
        }
        const { name, username, profile_picture_url } = await responseMe.json();

        // Save the long-lived access token to the database
        await db.connectedAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider: Provider.INSTAGRAM,
              providerAccountId: user_id,
            },
          },
          update: {
            userId: session.user.id,
            provider: Provider.INSTAGRAM,
            providerAccountId: user_id,
            status: AccountStatus.ACTIVE,
            accessToken: encryptToken(longToken),
            accessTokenExpiresAt: expires_in,
            tokenType: token_type,
            scope: permissions,
            lastSyncedAt: new Date(),
            displayName: name,
            username: username,
            profileImageUrl: profile_picture_url,
          },
          create: {
            userId: session.user.id,
            provider: Provider.INSTAGRAM,
            providerAccountId: user_id,
            status: AccountStatus.ACTIVE,
            accessToken: encryptToken(longToken),
            accessTokenExpiresAt: expires_in,
            tokenType: token_type,
            scope: permissions,
            oauthVersion: "OAUTH2",
            displayName: name,
            username: username,
            profileImageUrl: profile_picture_url,
          },
        });

        return NextResponse.redirect(
          new URL(`${DASHBOARD_REDIRECT}&connected=${provider}`, url),
        );
      } catch (error) {
        console.error(`[INSTAGRAM] Callback error:`, error);
        if (error instanceof Error) {
          return NextResponse.redirect(
            new URL(`${DASHBOARD_REDIRECT}?error=${error.message}`, url),
          );
        }

        return NextResponse.redirect(
          new URL(`${DASHBOARD_REDIRECT}?error=Unknown`, url),
        );
      }
  }
}
