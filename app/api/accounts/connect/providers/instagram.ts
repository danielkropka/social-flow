import { NextResponse } from "next/server";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

const SCOPE_LIST = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
];

export async function handleInstagramConnect() {
  if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !REDIRECT_URI) {
    return NextResponse.json({ error: "NoEnvConfiguration" }, { status: 500 });
  }

  const authorizeURL = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE_LIST.join(",")}`;

  const request = await fetch(authorizeURL);

  if (!request.ok) {
    return NextResponse.json({ error: "NoToken" }, { status: 500 });
  }

  const { url } = request;

  return NextResponse.json({ authUrl: url });
}
