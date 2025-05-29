import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const REDIRECT_URI = "https://social-flow.pl/instagram-callback";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Instagram",
        },
        { status: 401 }
      );
    }

    if (!INSTAGRAM_APP_ID) {
      console.error("Brak konfiguracji Instagram APP_ID");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Instagram",
        },
        { status: 500 }
      );
    }

    // Wymagane uprawnienia dla Instagram Graph API
    const scopes = [
      "instagram_business_basic",
      "instagram_business_content_publish",
    ].join(",");

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&response_type=code`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji Instagram:", error);
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować linku autoryzacji",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
