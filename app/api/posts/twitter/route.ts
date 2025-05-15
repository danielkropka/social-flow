import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { randomUUID } from "crypto";

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
    if (!account.accessToken) {
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

    // Przygotuj dane do publikacji
    const tweetData: TweetData = {
      text: content,
    };

    // Jeśli są media, najpierw je wgraj
    if (mediaUrls && mediaUrls.length > 0) {
      console.log("[TWITTER_POST] Uploading media...");
      const mediaIds = await Promise.all(
        mediaUrls.map(async (media: { url: string }) => {
          try {
            if (media.url.startsWith("data:image/")) {
              // Pobierz dane mediów z base64
              const base64Data = media.url.split(",")[1];
              const mediaBuffer = Buffer.from(base64Data, "base64");
              const mediaType = media.url.split(";")[0].split("/")[1];

              const initOptions = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `OAuth ${accessToken}`,
                },
                body: JSON.stringify({
                  additional_owners: [randomUUID().toString()],
                  media_category: "tweet_image",
                  total_bytes: mediaBuffer.byteLength.toString(),
                  media_type: `image/${mediaType}`,
                }),
              };

              const initResponse = await fetch(
                "https://api.twitter.com/2/media/upload/initialize",
                initOptions
              );

              if (!initResponse.ok) {
                const errorData = await initResponse.json().catch(() => null);
                const { title, detail, status } = errorData;
                throw new Error(`${title}: ${detail} (Status: ${status})`);
              }

              return "123";
            }
          } catch (error) {
            console.error("[TWITTER_POST] Media upload error:", error);
            throw error;
          }
        })
      );

      tweetData.media = { media_ids: mediaIds };
    }

    // Wyślij post używając OAuth 2.0 User Context
    try {
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `OAuth ${accessToken}`,
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
