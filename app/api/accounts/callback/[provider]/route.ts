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
        const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
        if (!APP_SECRET) {
          throw new Error("NO_CONFIGURATION");
        }

        const error = searchParams.get("error");
        switch (error) {
          case "access_denied":
            throw new Error("ACCESS_DENIED");
        }
        const code = searchParams.get("code");
        if (!code) throw new Error("NO_CODE");

        const requestAccessToken = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${code}`,
        );

        if (!requestAccessToken.ok) {
          const error = await requestAccessToken.json();

          console.error(error);
          throw new Error(error);
        }

        const { access_token } = await requestAccessToken.json();

        if (!access_token) {
          throw new Error("NO_ACCESS_TOKEN");
        }

        const fields = [
          "followers_count",
          "follows_count",
          "name",
          "profile_picture_url",
          "username",
          "id",
        ];

        const requestMe = await fetch(
          `https://graph.instagram.com/v23.0/me?fields=${fields.join(",")}&access_token=${access_token}`,
        );

        if (!requestMe.ok) {
          const error = await requestMe.json();
          throw new Error(error);
        }

        const responseMe = await requestMe.json();
        console.log(responseMe);
        // TODO: Add support for Instagram and improve error handling
        return NextResponse.json(
          { success: true, user: responseMe },
          { status: 200 },
        );
      } catch (error) {
        if (error instanceof Error) {
          return NextResponse.json(
            { error: `[${provider}] callback error: ${error.message}` },
            { status: 500 },
          );
        }

        return NextResponse.json(
          { error: `[${provider}]: Wystąpił nieznany błąd.` },
          { status: 500 },
        );
      }
  }
}
