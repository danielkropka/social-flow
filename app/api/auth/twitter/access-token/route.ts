import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { decryptToken, encryptToken } from "@/lib/utils/utils";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { withRateLimit } from "@/middleware/rateLimit";

export async function POST(req: Request) {
  return withRateLimit(async (req: Request) => {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Twitter",
        },
        { status: 401 }
      );
    }

    const { oauth_token, oauth_verifier } = await req.json();

    const requestToken = await db.connectedAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "TWITTER",
        status: "PENDING",
        requestTokenExpiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (
      !requestToken ||
      decryptToken(requestToken.requestToken!) !== oauth_token
    ) {
      return NextResponse.json(
        { error: "Nieprawidłowy lub wygasły token żądania" },
        { status: 400 }
      );
    }

    try {
      const requestOptions = {
        oauth_token,
        oauth_verifier,
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
        throw new Error("Nie udało się przydzielić tokenu");
      }

      const accessTokenText = await accessTokenResponse.text();
      const accessTokenParams = new URLSearchParams(accessTokenText);
      const accessToken = accessTokenParams.get("oauth_token");
      const accessTokenSecret = accessTokenParams.get("oauth_token_secret");

      if (!accessToken || !accessTokenSecret) {
        throw new Error("Brak wymaganych tokenów w odpowiedzi");
      }

      const fields = ["profile_image_url", "username", "name"];

      const oauth = new OAuth({
        consumer: {
          key: process.env.TWITTER_API_KEY!,
          secret: process.env.TWITTER_API_SECRET!,
        },
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
        const errorData = await userResponse.json();
        console.error("Twitter API error:", errorData);
        throw new Error("Nie udało się pobrać danych użytkownika");
      }

      const userData = await userResponse.json();
      const account = userData.data;

      await db.connectedAccount.delete({
        where: {
          id: requestToken.id,
        },
      });

      await db.connectedAccount.create({
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
        },
      });

      return NextResponse.json({
        success: true,
        account,
      });
    } catch (error) {
      console.error("Twitter API error:", error);
      return NextResponse.json(
        { error: "Wystąpił błąd podczas autoryzacji tokenu" },
        { status: 500 }
      );
    }
  })(req);
}
