import { NextResponse, NextRequest } from "next/server";
import { withRateLimit } from "@/middleware/rateLimit";
import { db } from "@/lib/config/prisma";
import { TwitterApi } from "twitter-api-v2";
import { decryptToken } from "@/lib/utils/utils";

export async function POST(request: NextRequest) {
  return await withRateLimit(async () => {
    try {
      const { userId } = await request.json();

      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }

      const twitterAccounts = await db.connectedAccount.findMany({
        where: {
          userId: userId,
          provider: "TWITTER",
          status: "ACTIVE",
        },
      });

      for (const account of twitterAccounts) {
        const client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY!,
          appSecret: process.env.TWITTER_API_SECRET!,
          accessToken: decryptToken(account.accessToken!),
          accessSecret: decryptToken(account.accessTokenSecret!),
        });

        if (!client) {
          throw new Error("Nie udało się utworzyć klienta Twitter");
        }

        const user = await client.v2.me({
          "user.fields": ["public_metrics"],
        });

        if (!user) {
          throw new Error("Nie udało się pobrać informacji o użytkowniku");
        }

        await db.connectedAccount.update({
          where: { id: account.id },
          data: {
            followersCount: user.data.public_metrics?.followers_count || 0,
            postsCount: user.data.public_metrics?.tweet_count || 0,
            lastStatsUpdate: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Błąd podczas odświeżania statystyk Twitter:", error);
      return NextResponse.json(
        { error: "Wystąpił błąd podczas odświeżania statystyk Twitter" },
        { status: 500 }
      );
    }
  });
}
