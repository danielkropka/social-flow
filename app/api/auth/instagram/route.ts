import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = "https://social-flow-flame.vercel.app/instagram-callback";

export async function POST(request: Request) {
  try {
    // Pobierz zalogowanego użytkownika
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    const formData = new URLSearchParams();
    formData.append("client_id", INSTAGRAM_CLIENT_ID!);
    formData.append("client_secret", INSTAGRAM_CLIENT_SECRET!);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", REDIRECT_URI);
    formData.append("code", code);

    const response = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Instagram API error:", errorData);
      throw new Error(`Błąd podczas wymiany kodu na token: ${errorData}`);
    }

    const data = await response.json();

    // Pobierz długoterminowy token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${data.access_token}`
    );

    if (!longLivedTokenResponse.ok) {
      const errorData = await longLivedTokenResponse.text();
      console.error("Instagram Long-lived token error:", errorData);
      throw new Error(
        `Błąd podczas pobierania długoterminowego tokenu: ${errorData}`
      );
    }

    const longLivedTokenData = await longLivedTokenResponse.json();

    // Pobierz informacje o koncie Instagram
    const userInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`
    );

    if (!userInfoResponse.ok) {
      throw new Error("Nie udało się pobrać informacji o koncie Instagram");
    }

    const userInfo = await userInfoResponse.json();

    // Zapisz token w bazie danych
    const connectedAccount = await prisma.connectedAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: "INSTAGRAM",
          providerAccountId: userInfo.id,
        },
      },
      update: {
        accessToken: longLivedTokenData.access_token,
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        username: userInfo.username,
      },
      create: {
        provider: "INSTAGRAM",
        providerAccountId: userInfo.id,
        accessToken: longLivedTokenData.access_token,
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        name: userInfo.username,
        username: userInfo.username,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      account: connectedAccount,
    });
  } catch (error) {
    console.error("Błąd autoryzacji Instagram:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas autoryzacji",
      },
      { status: 500 }
    );
  }
}
