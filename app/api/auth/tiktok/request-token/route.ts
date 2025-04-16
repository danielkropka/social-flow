import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/access-token`;

    if (!clientKey || !clientSecret) {
      return NextResponse.json(
        { error: "Brak konfiguracji TikTok" },
        { status: 500 }
      );
    }

    const authUrl = `https://www.tiktok.com/auth/authorize?client_key=${clientKey}&scope=user.info.basic,video.publish&response_type=code&redirect_uri=${redirectUri}&state=${session.user.id}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji TikTok:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania URL autoryzacji" },
      { status: 500 }
    );
  }
}
