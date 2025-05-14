import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
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
    const session = await getAuthSession();
    console.log("[TWITTER_POST] Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
    });

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

    console.log("[TWITTER_POST] Request data:", {
      accountId,
      hasContent: !!content,
      mediaCount: mediaUrls?.length || 0,
    });

    // Pobierz dane konta Twitter
    const account = await db.connectedAccount.findUnique({
      where: {
        id: accountId,
        provider: "TWITTER",
        userId: session.user.id,
      },
    });

    console.log("[TWITTER_POST] Account check:", {
      found: !!account,
      hasAccessToken: !!account?.accessToken,
      hasAccessTokenSecret: !!account?.accessTokenSecret,
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: "Nie znaleziono konta Twitter",
          details:
            "Konto Twitter nie zostało znalezione lub nie masz do niego dostępu",
        },
        { status: 404 }
      );
    }

    // Sprawdź czy token dostępu istnieje
    if (!account.accessToken || !account.accessTokenSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Brak tokenu dostępu",
          details: "Konto Twitter wymaga ponownej autoryzacji",
        },
        { status: 401 }
      );
    }

    const accessToken = account.accessToken;
    const accessTokenSecret = account.accessTokenSecret;

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
      console.log("[TWITTER_POST] Uploading media...");
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
              key: accessToken,
              secret: accessTokenSecret,
            })
          );

          console.log("[TWITTER_POST] Media upload request:", {
            url: mediaRequestData.url,
            headers: mediaHeaders,
          });

          const mediaUploadResponse = await fetch(mediaRequestData.url, {
            method: "POST",
            headers: {
              ...mediaHeaders,
              "Content-Type": "multipart/form-data",
            },
            body: mediaBuffer,
          });

          if (!mediaUploadResponse.ok) {
            const errorData = await mediaUploadResponse
              .json()
              .catch(() => null);
            console.error("[TWITTER_POST] Media upload error:", {
              status: mediaUploadResponse.status,
              statusText: mediaUploadResponse.statusText,
              errorData,
            });
            throw new Error(
              errorData?.detail || "Błąd podczas wgrywania mediów"
            );
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
        key: accessToken,
        secret: accessTokenSecret,
      })
    );

    console.log("[TWITTER_POST] Tweet request:", {
      url: requestData.url,
      headers: headers,
      tweetData,
    });

    // Wyślij post
    try {
      const response = await fetch(requestData.url, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tweetData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("[TWITTER_POST] Response error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          errorData?.detail ||
            `Błąd podczas publikacji na Twitterze (${response.status})`
        );
      }

      const result = await response.json();
      console.log("[TWITTER_POST] Success:", result);
      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("[TWITTER_POST] Fetch error:", {
        error,
        requestData,
        headers: headers,
        tweetData,
      });

      if (error instanceof Error) {
        if (error.message.includes("fetch failed")) {
          return NextResponse.json(
            {
              success: false,
              error: "Błąd połączenia z Twitterem",
              details:
                "Nie można połączyć się z serwerem Twittera. Sprawdź swoje połączenie internetowe i spróbuj ponownie.",
            },
            { status: 503 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Wystąpił błąd podczas publikacji na Twitterze",
          details: error instanceof Error ? error.message : "Nieznany błąd",
        },
        { status: 500 }
      );
    }
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
