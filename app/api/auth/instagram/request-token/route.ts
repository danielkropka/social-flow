import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const REDIRECT_URI = "https://social-flow-flame.vercel.app/instagram-callback";

export async function GET() {
  try {
    const session = await getAuthSession();

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
      "instagram_basic", // Podstawowe informacje o profilu
      "instagram_content_publish", // Publikowanie treści
      "pages_show_list", // Lista stron Facebook
      "pages_read_engagement", // Dostęp do interakcji na stronach
    ].join(",");

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&response_type=code&state=${session.user.id}`;

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
