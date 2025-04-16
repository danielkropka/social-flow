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
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${data.access_token}`
    );

    if (!userInfoResponse.ok) {
      throw new Error("Nie udało się pobrać informacji o koncie Instagram");
    }

    const userInfo = await userInfoResponse.json();

    // Sprawdź czy konto jest połączone z Facebookiem i czy jest to konto firmowe/twórcy
    const accountInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url,account_type&access_token=${data.access_token}`
    );

    if (!accountInfoResponse.ok) {
      throw new Error(
        "Nie udało się pobrać szczegółowych informacji o koncie Instagram"
      );
    }

    const accountInfo = await accountInfoResponse.json();

    // Wymień token Instagram na token Facebooka
    const facebookTokenResponse = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${INSTAGRAM_CLIENT_ID}&client_secret=${INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${data.access_token}`
    );

    if (!facebookTokenResponse.ok) {
      const errorData = await facebookTokenResponse.json();
      console.error("Facebook token exchange error:", errorData);
      return NextResponse.json(
        { error: "Nie udało się wymienić tokenu Instagram na token Facebooka" },
        { status: 400 }
      );
    }

    const facebookTokenData = await facebookTokenResponse.json();
    const facebookAccessToken = facebookTokenData.access_token;

    // Sprawdź czy konto jest połączone z Facebookiem
    const facebookPagesResponse = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?access_token=${facebookAccessToken}`
    );

    const facebookPagesData = await facebookPagesResponse.json();

    if (!facebookPagesResponse.ok) {
      console.error("Facebook API error:", facebookPagesData);
      return NextResponse.json(
        {
          error:
            "Konto Instagram musi być połączone z Facebookiem. Upewnij się, że masz odpowiednie uprawnienia.",
        },
        { status: 400 }
      );
    }

    // Sprawdź czy konto jest firmowe lub twórcy
    if (
      accountInfo.account_type !== "BUSINESS" &&
      accountInfo.account_type !== "CREATOR"
    ) {
      console.error("Instagram account type:", accountInfo.account_type);
      return NextResponse.json(
        {
          error:
            "Konto Instagram musi być kontem firmowym lub twórcy. Aktualny typ konta: " +
            accountInfo.account_type,
        },
        { status: 400 }
      );
    }

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
        profileImage: userInfo.profile_picture_url,
      },
      create: {
        provider: "INSTAGRAM",
        providerAccountId: userInfo.id,
        accessToken: longLivedTokenData.access_token,
        expiresAt: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        name: userInfo.username,
        username: userInfo.username,
        profileImage: userInfo.profile_picture_url,
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
