import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = crypto.randomBytes(32).toString("hex");

    return NextResponse.json({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: FACEBOOK_REDIRECT_URI,
      state,
    });
  } catch (error) {
    console.error("Error generating Facebook request token:", error);
    return NextResponse.json(
      { error: "Failed to generate Facebook request token" },
      { status: 500 }
    );
  }
}
