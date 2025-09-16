import {AccountStatus, Provider} from "@prisma/client";
import {NextResponse} from "next/server";
import {createClient} from "@redis/client";
import {getServerSession} from "next-auth/next";
import {authOptions} from "@/lib/config/auth";
import {TwitterApi} from "twitter-api-v2";
import {db} from "@/lib/config/prisma";

const DASHBOARD_REDIRECT = "/dashboard"

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }>}) {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const provider = (await params).provider as Provider;
    if (!provider || !Object.values(Provider).includes(provider)) {
        return NextResponse.redirect(new URL(`/dashboard?error=unsupported_provider`, url));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Nie jesteś zalogowany" }, { status: 401 });
    }

    try {
        switch (provider) {
            case Provider.TWITTER:
                const denied = searchParams.get("denied");
                if (denied) return NextResponse.redirect(new URL(`${DASHBOARD_REDIRECT}?error=twitter_denied`, url));

                const oauth_token = searchParams.get("oauth_token");
                const oauth_verifier = searchParams.get("oauth_verifier");
                if (!oauth_token || !oauth_verifier) return NextResponse.redirect(new URL(`${DASHBOARD_REDIRECT}?error=twitter_missing_params`, url));

                const client = createClient({
                    username: "default",
                    password: process.env.REDIS_DATABASE_PASSWORD,
                    socket: {
                        host: process.env.REDIS_DATABASE_URL,
                        port: 11273,
                    },
                });

                await client.connect();

                const redisKey = `tw:oauth:req_secret:${session.user.id}:${oauth_token}`;
                const requestTokenSecret = await client.get(redisKey);

                if (!requestTokenSecret) {
                    await client.quit();
                    return NextResponse.redirect(new URL(`${DASHBOARD_REDIRECT}?error=session_expired`, url));
                }

                await client.del(redisKey);
                await client.quit();

                const oauth = new TwitterApi({
                    appKey: process.env.TWITTER_API_KEY!,
                    appSecret: process.env.TWITTER_API_SECRET!,
                    accessToken: oauth_token,
                    accessSecret: requestTokenSecret
                });

                const {accessToken, accessSecret, screenName, userId} = await oauth.login(oauth_verifier);

                const authed = new TwitterApi({
                    appKey: process.env.TWITTER_API_KEY!,
                    appSecret: process.env.TWITTER_API_SECRET!,
                    accessToken,
                    accessSecret
                });

                const me = await authed.v1.verifyCredentials();
                const avatar = me.profile_image_url_https?.replace("_normal", "") ?? undefined;
                const name = me.name ?? screenName ?? "Twitter User";
                const username = me.screen_name ?? screenName ?? "";
                const profileUrl = username ? `https://twitter.com/${username}` : undefined;

                await db.connectedAccount.upsert({
                    where: {
                        provider_providerAccountId: {
                            provider,
                            providerAccountId: userId
                        },
                    },
                    update: {
                        accessToken,
                        accessSecret,
                        oauthVersion: "OAUTH1",
                        displayName: name ?? undefined,
                        username: username ?? undefined,
                        profileImageUrl: avatar ?? undefined,
                        profileUrl: avatar ?? undefined,
                        lastSyncedAt: new Date(),
                        status: AccountStatus.ACTIVE,
                        lastErrorAt: null,
                        lastErrorMessage: null
                    },
                    create: {
                        userId: session.user.id,
                        provider,
                        providerAccountId: userId,
                        accessToken,
                        accessSecret,
                        oauthVersion: "OAUTH1",
                        oauthTokenSecret: null,
                        displayName: name ?? undefined,
                        username: username ?? undefined,
                        profileImageUrl: avatar ?? undefined,
                        profileUrl: profileUrl ?? undefined,
                    }
                });
                return NextResponse.redirect(new URL(`${DASHBOARD_REDIRECT}?connected=${provider}`, url));
        }
    }
    catch (error) {
        console.error(`[${provider}] callback error:`, error);
        return NextResponse.redirect(new URL(`${DASHBOARD_REDIRECT}?error=${provider}_callback`, url));
    }
}