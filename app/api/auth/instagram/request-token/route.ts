import { NextResponse } from "next/server";

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_APP_ID;
const REDIRECT_URI = "https://social-flow-flame.vercel.app/instagram-callback";

export async function GET() {
  try {
    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Błąd podczas generowania URL autoryzacji:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania URL autoryzacji" },
      { status: 500 }
    );
  }
}
