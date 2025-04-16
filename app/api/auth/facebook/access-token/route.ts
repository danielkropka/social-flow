import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Wymień kod na token dostępu
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Facebook API error: ${error}`);
    }

    const { access_token } = await tokenResponse.json();

    // Pobierz informacje o użytkowniku
    const userResponse = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=id,name,picture&access_token=${access_token}`
    );

    if (!userResponse.ok) {
      const error = await userResponse.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    const userInfo = await userResponse.json();

    // Zapisz konto do bazy danych
    await db.connectedAccount.create({
      data: {
        provider: "FACEBOOK",
        providerAccountId: userInfo.id,
        accessToken: access_token,
        name: userInfo.name,
        username: userInfo.name,
        profileImage: userInfo.picture?.data?.url,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        username: userInfo.name,
        name: userInfo.name,
        profileImage: userInfo.picture?.data?.url,
        access_token,
      },
    });
  } catch (error) {
    console.error("Error getting Facebook access token:", error);
    return NextResponse.json(
      { error: "Failed to get Facebook access token" },
      { status: 500 }
    );
  }
}
