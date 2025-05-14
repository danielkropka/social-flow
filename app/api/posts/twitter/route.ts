import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

interface TweetMedia {
  media_ids: string[];
}

interface TweetData {
  text: string;
  media?: TweetMedia;
}

export async function POST(req: Request) {
  try {
    // Sprawdzenie autoryzacji
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Brak autoryzacji",
          details: "Zaloguj się, aby kontynuować",
        },
        { status: 401 }
      );
    }

    // Pobierz dane z żądania
    const body = await req.json();
    const { content, mediaUrls, accountId } = body;

    // Pobierz dane konta Twitter
    const account = await db.connectedAccount.findUnique({
      where: {
        id: accountId,
        provider: "TWITTER",
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: "Nie znaleziono konta Twitter",
          details: "Konto Twitter nie zostało znalezione",
        },
        { status: 404 }
      );
    }

    // Inicjalizacja OAuth 1.0a
    const oauth = new OAuth({
      consumer: {
        key: TWITTER_API_KEY!,
        secret: TWITTER_API_SECRET!,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });

    // Przygotuj dane do publikacji
    const tweetData: TweetData = {
      text: content,
    };

    // Jeśli są media, najpierw je wgraj
    if (mediaUrls && mediaUrls.length > 0) {
      const mediaIds = await Promise.all(
        mediaUrls.map(async (media: { url: string }) => {
          const mediaResponse = await fetch(media.url);
          const mediaBuffer = await mediaResponse.arrayBuffer();

          const mediaRequestData = {
            url: "https://upload.twitter.com/1.1/media/upload.json",
            method: "POST",
          };

          const mediaHeaders = oauth.toHeader(
            oauth.authorize(mediaRequestData, {
              key: account.accessToken!,
              secret: account.accessTokenSecret!,
            })
          );

          const mediaUploadResponse = await fetch(mediaRequestData.url, {
            method: "POST",
            headers: {
              ...mediaHeaders,
              "Content-Type": "multipart/form-data",
            },
            body: mediaBuffer,
          });

          if (!mediaUploadResponse.ok) {
            throw new Error("Błąd podczas wgrywania mediów");
          }

          const mediaData = await mediaUploadResponse.json();
          return mediaData.media_id_string;
        })
      );

      tweetData.media = { media_ids: mediaIds };
    }

    // Przygotuj nagłówki dla API
    const requestData = {
      url: "https://api.twitter.com/2/tweets",
      method: "POST",
    };

    const headers = oauth.toHeader(
      oauth.authorize(requestData, {
        key: account.accessToken!,
        secret: account.accessTokenSecret!,
      })
    );

    // Wyślij post
    const response = await fetch(requestData.url, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "Błąd podczas publikacji na Twitterze"
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[TWITTER_POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Wystąpił błąd podczas publikacji na Twitterze",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
