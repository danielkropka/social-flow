import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/utils";

export async function POST(request: Request) {
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

  const { oauth_token, oauth_verifier } = await request.json();

  const requestToken = await db.twitterRequestToken.findFirst({
    where: {
      userId: session.user.id,
      token: oauth_token,
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000), // tokeny starsze niż 10 minut są nieważne
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!requestToken || decryptToken(requestToken.token) !== oauth_token) {
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
      const errorData = await accessTokenResponse.json();
      console.error("Twitter API error:", errorData);
      return NextResponse.json(
        { error: "Nie udało się przydzielić tokenu" },
        { status: 400 }
      );
    }

    const accessTokenData = await accessTokenResponse.json();
    const accessToken = accessTokenData.oauth_token;
    const accessTokenSecret = accessTokenData.oauth_token_secret;

    const fields = ["profile_image_url", "username", "name"];

    const userResponse = await fetch("https://api.x.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        "user.fields": fields.join(","),
      }),
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error("Twitter API error:", errorData);
      return NextResponse.json(
        { error: "Nie udało się pobrać danych użytkownika" },
        { status: 400 }
      );
    }

    const userData = await userResponse.json();
    const account = userData.data;

    await db.twitterRequestToken.delete({
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
}
