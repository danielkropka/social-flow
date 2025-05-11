import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Brak kodu autoryzacji" },
        { status: 400 }
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = `https://social-flow.pl/tiktok-callback/`;

    if (!clientKey || !clientSecret) {
      return NextResponse.json(
        { error: "Brak konfiguracji TikTok" },
        { status: 500 }
      );
    }

    const formData = new URLSearchParams();
    formData.append("client_key", clientKey);
    formData.append("client_secret", clientSecret);
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", redirectUri);

    // Pobierz token dostępu
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error("Błąd TikTok API:", error);
      throw new Error(
        error.error_description || "Błąd podczas pobierania tokena"
      );
    }

    const tokenData = await tokenResponse.json();

    // Pobierz informacje o użytkowniku
    const userResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error("Błąd podczas pobierania informacji o użytkowniku");
    }

    const userInfo = await userResponse.json();

    // Zapisz konto do bazy danych
    const connectedAccount = await db.connectedAccount.create({
      data: {
        provider: "TIKTOK",
        providerAccountId: userInfo.data.user.open_id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        name: userInfo.data.user.display_name,
        username: userInfo.data.user.username,
        profileImage: userInfo.data.user.avatar_url,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      account: connectedAccount,
    });
  } catch (error) {
    console.error("Błąd autoryzacji TikTok:", error);
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
