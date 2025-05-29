import { NextResponse, NextRequest } from "next/server";
import { withRateLimit } from "@/middleware/rateLimit";
import { db } from "@/lib/config/prisma";
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

      const instagramAccounts = await db.connectedAccount.findMany({
        where: {
          userId: userId,
          provider: "INSTAGRAM",
          status: "ACTIVE",
        },
      });

      for (const account of instagramAccounts) {
        const response = await fetch(
          `https://graph.instagram.com/v22.0/${account.providerAccountId}?fields=followers_count,media_count&access_token=${decryptToken(
            account.accessToken
          )}`
        );

        if (!response.ok) {
          throw new Error("Nie udało się pobrać informacji o użytkowniku");
        }

        const user = await response.json();

        if (!user) {
          throw new Error("Nie udało się pobrać informacji o użytkowniku");
        }

        await db.connectedAccount.update({
          where: { id: account.id },
          data: {
            followersCount: user.followers_count || 0,
            postsCount: user.media_count || 0,
            lastStatsUpdate: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Błąd podczas odświeżania statystyk Instagram:", error);
      return NextResponse.json(
        { error: "Wystąpił błąd podczas odświeżania statystyk Instagram" },
        { status: 500 }
      );
    }
  });
}
