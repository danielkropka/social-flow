import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
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

    const REDIRECT_URI = "https://social-flow.pl/facebook-callback";
    const state = crypto.randomBytes(32).toString("hex");

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=${scopes}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji Facebook:", error);
    return NextResponse.json(
      { error: "Nie udało się wygenerować URL autoryzacji" },
      { status: 500 }
    );
  }
}
