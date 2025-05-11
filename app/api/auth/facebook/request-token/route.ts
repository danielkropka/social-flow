import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthSession } from "@/lib/auth";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const REDIRECT_URI = "https://social-flow.pl/facebook-callback";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Nie jesteś zalogowany",
          details: "Musisz być zalogowany, aby połączyć konto Facebook",
        },
        { status: 401 }
      );
    }

    if (!FACEBOOK_APP_ID) {
      console.error("Brak konfiguracji Facebook APP_ID");
      return NextResponse.json(
        {
          error: "Błąd konfiguracji",
          details: "Brak wymaganej konfiguracji Facebook",
        },
        { status: 500 }
      );
    }

    // Wymagane uprawnienia dla Facebook Graph API
    const scopes = [
      "pages_show_list", // Lista stron Facebook
      "pages_read_engagement", // Dostęp do interakcji na stronach
      "pages_manage_posts", // Zarządzanie postami na stronach
      "pages_manage_metadata", // Zarządzanie metadanymi stron
      "public_profile", // Podstawowe informacje o profilu
      "email", // Dostęp do adresu email
    ].join(",");

    const state = crypto.randomBytes(32).toString("hex");
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=${scopes}`;

    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji Facebook:", error);
    return NextResponse.json(
      {
        error: "Nie udało się wygenerować linku autoryzacji",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
