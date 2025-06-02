import { db } from "@/lib/config/prisma";
import { decryptToken } from "@/lib/utils/utils";
import { TwitterApi } from "twitter-api-v2";

export async function refreshAllStats(userId: string) {
  const results: {
    provider: string;
    accountId: string;
    status: string;
    error?: string;
  }[] = [];
  const accounts = await db.connectedAccount.findMany({
    where: { status: "ACTIVE", userId },
  });

  for (const account of accounts) {
    try {
      switch (account.provider) {
        case "INSTAGRAM": {
          const response = await fetch(
            `https://graph.instagram.com/v22.0/${account.providerAccountId}?fields=followers_count,media_count&access_token=${decryptToken(
              account.accessToken
            )}`
          );
          if (!response.ok) throw new Error("Błąd API Instagrama");
          const user = await response.json();
          await db.connectedAccount.update({
            where: { id: account.id },
            data: {
              followersCount: user.followers_count || 0,
              postsCount: user.media_count || 0,
              lastStatsUpdate: new Date(),
            },
          });
          results.push({
            provider: "INSTAGRAM",
            accountId: account.id,
            status: "success",
          });
          break;
        }
        case "TWITTER": {
          const client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY!,
            appSecret: process.env.TWITTER_API_SECRET!,
            accessToken: decryptToken(account.accessToken!),
            accessSecret: decryptToken(account.accessTokenSecret!),
          });
          const user = await client.v2.me({
            "user.fields": ["public_metrics"],
          });
          await db.connectedAccount.update({
            where: { id: account.id },
            data: {
              followersCount: user.data.public_metrics?.followers_count || 0,
              postsCount: user.data.public_metrics?.tweet_count || 0,
              lastStatsUpdate: new Date(),
            },
          });
          results.push({
            provider: "TWITTER",
            accountId: account.id,
            status: "success",
          });
          break;
        }
        default: {
          results.push({
            provider: account.provider,
            accountId: account.id,
            status: "not_supported",
            error: `Platforma ${account.provider} nie jest jeszcze obsługiwana`,
          });
          break;
        }
      }
    } catch (error: any) {
      results.push({
        provider: account.provider,
        accountId: account.id,
        status: "error",
        error: error.message,
      });
    }
  }
  return results;
}
