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
    const redirectUri = `https://social-flow-flame.vercel.app/verify/tiktok-callback`;

    if (!clientKey || !clientSecret) {
      return NextResponse.json(
        { error: "Brak konfiguracji TikTok" },
        { status: 500 }
      );
    }

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=user.info.basic%2Cvideo.list%2Cuser.info.stats&redirect_uri=${redirectUri}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji TikTok:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania URL autoryzacji" },
      { status: 500 }
    );
  }
}
