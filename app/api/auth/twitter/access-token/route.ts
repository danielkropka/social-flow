import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

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

  const { twitterRequestToken, twitterRequestTokenSecret } = session;

  if (!twitterRequestToken || !twitterRequestTokenSecret) {
    return NextResponse.json(
      { error: "Brak wymaganych tokenów Twitter" },
      { status: 400 }
    );
  }

  const { oauth_token, oauth_verifier } = await request.json();

  if (twitterRequestToken !== oauth_token) {
    return NextResponse.json(
      { error: "Nieprawidłowy token żądania" },
      { status: 400 }
    );
  }

  try {
    const requestOptions = {
      oauth_token,
      oauth_verifier,
    };

    const requestTokenResponse = await fetch(
      "https://api.x.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(requestOptions),
      }
    );

    if (!requestTokenResponse.ok) {
      const errorData = await requestTokenResponse.json();
      console.error("Twitter API error:", errorData);
      return NextResponse.json(
        { error: "Nie udało się przydzielić tokenu" },
        { status: 400 }
      );
    }

    const requestTokenData = await requestTokenResponse.json();
    const accessToken = requestTokenData.oauth_token;
    const accessTokenSecret = requestTokenData.oauth_token_secret;

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
