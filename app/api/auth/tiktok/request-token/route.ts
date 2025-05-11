import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto TikTok",
        },
        { status: 401 }
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = `https://social-flow.pl/tiktok-callback/`;

    if (!clientKey || !clientSecret) {
      console.error("Brak konfiguracji TikTok");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji TikTok",
        },
        { status: 500 }
      );
    }

    // Generuj state i zapisz w cookies
    const state = crypto.randomBytes(32).toString("hex");

    const response = NextResponse.json({
      authUrl: `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${[
        "user.info.basic",
        "user.info.stats",
        "user.info.profile",
        "video.list",
        "video.publish",
        "video.upload",
      ].join(",")}&redirect_uri=${redirectUri}&state=${state}`,
      state,
    });

    // Ustaw cookie w odpowiedzi
    response.cookies.set("csrfState", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minut
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji TikTok:", error);
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować linku autoryzacji",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
