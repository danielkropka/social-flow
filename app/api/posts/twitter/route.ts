import { getAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, mediaUrls, accountId } = await req.json();
  console.log(content, mediaUrls, accountId);

  const account = await db.connectedAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      provider: "TWITTER",
    },
  });

  if (!account || !account.accessToken || !account.accessTokenSecret) {
    throw new Error("Nie znaleziono konta Twitter lub brak tokenów dostępu");
  }

  const accessToken = decryptToken(account.accessToken);
  const accessTokenSecret = decryptToken(account.accessTokenSecret);

  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    throw new Error("Brak skonfigurowanych kluczy API Twittera");
  }

  if (!accessToken || !accessTokenSecret) {
    throw new Error("Brak tokenów dostępu do Twittera");
  }

  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`
        ).toString("base64")}`,
        grant_type: "client_credentials",
      },
    };

    const response = await fetch(
      "https://api.twitter.com/oauth2/token",
      options
    );

    if (!response.ok) {
      throw new Error("Nie udało się uzyskać tokenu dostępu");
    }

    const data = await response.text();
    const parsedData = new URLSearchParams(data);
    const bearerToken = parsedData.get("access_token");
    const tokenType = parsedData.get("token_type");

    console.log(bearerToken);
    console.log(tokenType);

    if (!tokenType || tokenType !== "bearer") {
      throw new Error("Nieprawidłowy token dostępu");
    }

    return NextResponse.json({
      success: true,
      bearerToken,
      tokenType,
    });
  } catch (error) {
    console.error("Error while posting to Twitter:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd w trakcie publikowania postu na Twitter.",
      },
      { status: 500 }
    );
  }
}
