import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { withRateLimit } from "@/middleware/rateLimit";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = "https://social-flow.pl/facebook-callback";

export async function POST(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      // Pobierz zalogowanego użytkownika
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        throw new Error("Nie jesteś zalogowany");
      }

      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        console.error("Brak konfiguracji Facebook");
        throw new Error("Brak wymaganej konfiguracji Facebook");
      }

      const { code } = await request.json();

      if (!code) {
        throw new Error("Brak kodu autoryzacji");
      }

      // Wymiana kodu na token dostępu
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Facebook API error:", errorData);
        throw new Error("Błąd podczas wymiany kodu na token");
      }

      const tokenData = await tokenResponse.json();

      // Pobierz długoterminowy token
      const longLivedTokenResponse = await fetch(
        `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
      );

      if (!longLivedTokenResponse.ok) {
        const errorData = await longLivedTokenResponse.json();
        console.error("Facebook Long-lived token error:", errorData);
        throw new Error("Błąd podczas pobierania długoterminowego tokenu");
      }

      const longLivedTokenData = await longLivedTokenResponse.json();

      // Pobierz informacje o użytkowniku
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/v22.0/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
      );

      if (!userInfoResponse.ok) {
        const errorData = await userInfoResponse.json();
        console.error("Facebook User Info error:", errorData);
        throw new Error("Nie udało się pobrać informacji o koncie Facebook");
      }

      const userInfo = await userInfoResponse.json();

      // Pobierz listę stron użytkownika
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?access_token=${tokenData.access_token}`
      );

      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json();
        console.error("Facebook Pages error:", errorData);
        throw new Error("Nie udało się pobrać listy stron Facebook");
      }

      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("Brak stron Facebook");
      }

      try {
        // Sprawdź, czy konto już istnieje
        const existingAccount = await db.connectedAccount.findFirst({
          where: {
            provider: "FACEBOOK",
            providerAccountId: userInfo.id,
            userId: session.user.id,
          },
        });

        if (!existingAccount) {
          throw new Error("Konto Facebook nie istnieje");
        }

        const connectedAccount = await db.connectedAccount.upsert({
          where: {
            id: existingAccount.id,
          },
          update: {
            accessToken: longLivedTokenData.access_token,
            expiresAt: new Date(
              Date.now() + longLivedTokenData.expires_in * 1000
            ),
            username: userInfo.name,
            profileImage: userInfo.picture?.data?.url,
          },
          create: {
            provider: "FACEBOOK",
            providerAccountId: userInfo.id,
            accessToken: longLivedTokenData.access_token,
            expiresAt: new Date(
              Date.now() + longLivedTokenData.expires_in * 1000
            ),
            name: userInfo.name,
            username: userInfo.name,
            profileImage: userInfo.picture?.data?.url,
            userId: session.user.id,
          },
        });

        return NextResponse.json({
          success: true,
          account: connectedAccount,
        });
      } catch (dbError) {
        console.error("Błąd bazy danych:", dbError);
        return NextResponse.json(
          {
            error: "Nie udało się zapisać danych konta Facebook",
            details: "Błąd podczas zapisywania w bazie danych",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Błąd autoryzacji Facebook:", error);
      return NextResponse.json(
        {
          error: "Wystąpił nieoczekiwany błąd podczas łączenia z Facebook",
          details: error instanceof Error ? error.message : "Nieznany błąd",
        },
        { status: 500 }
      );
    }
  })(request);
}
