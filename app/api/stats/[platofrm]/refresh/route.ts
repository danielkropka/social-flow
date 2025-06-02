import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { decryptToken } from "@/lib/utils/utils";
import { TwitterApi } from "twitter-api-v2";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { Provider } from "@prisma/client";

// Funkcja symulująca odświeżenie statystyk dla pojedynczej platformy
async function refreshSingleStat(userId: string, platform: string) {
  // Pobierz aktywne konto użytkownika dla danej platformy
  const provider = platform.toUpperCase() as Provider;
  const account = await db.connectedAccount.findFirst({
    where: {
      userId,
      provider,
      status: "ACTIVE",
    },
  });
  if (!account) {
    throw new Error("Nie znaleziono aktywnego konta dla tej platformy.");
  }
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
      break;
    }
    default:
      throw new Error(
        `Platforma ${account.provider} nie jest jeszcze obsługiwana.`
      );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }
  const { platform } = await request.json();
  if (!platform) {
    return NextResponse.json(
      { error: "Brak nazwy platformy." },
      { status: 400 }
    );
  }
  try {
    await refreshSingleStat(session.user.id, platform);
    return NextResponse.json({
      message: `Statystyki dla platformy ${platform} zostały odświeżone.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Błąd podczas odświeżania statystyk." },
      { status: 500 }
    );
  }
}
