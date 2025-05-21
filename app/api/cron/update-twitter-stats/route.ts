import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { TwitterApi } from "twitter-api-v2";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function updateTwitterStats() {
  try {
    // Pobierz wszystkie aktywne konta Twitter
    const twitterAccounts = await db.connectedAccount.findMany({
      where: {
        provider: "TWITTER",
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    for (const account of twitterAccounts) {
      try {
        // Inicjalizacja klienta Twitter
        const client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY!,
          appSecret: process.env.TWITTER_API_SECRET!,
          accessToken: account.accessToken,
          accessSecret: account.accessTokenSecret!,
        });

        // Pobierz informacje o użytkowniku
        const user = await client.v2.me({
          "user.fields": ["public_metrics"],
        });

        // Aktualizuj statystyki w bazie danych
        await db.connectedAccount.update({
          where: { id: account.id },
          data: {
            followersCount: user.data.public_metrics?.followers_count || 0,
            postsCount: user.data.public_metrics?.tweet_count || 0,
            lastStatsUpdate: new Date(),
          },
        });
      } catch (error) {
        console.error(
          `Błąd podczas aktualizacji konta ${account.username}:`,
          error
        );
        continue;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd podczas aktualizacji statystyk Twitter:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji statystyk" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Sprawdź secret key dla bezpieczeństwa
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return updateTwitterStats();
}
