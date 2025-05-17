import { getAuthSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { decryptToken } from "@/lib/utils";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, mediaUrls, accountId } = await req.json();

    // Pobierz konto Twittera
    const account = await db.connectedAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
        provider: "TWITTER",
      },
    });

    if (!account || !account.accessToken || !account.accessTokenSecret) {
      return NextResponse.json(
        { error: "Nie znaleziono konta Twitter lub brak tokenów dostępu" },
        { status: 404 }
      );
    }

    const accessToken = decryptToken(account.accessToken);
    const accessTokenSecret = decryptToken(account.accessTokenSecret);

    // Walidacja kluczy API
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      throw new Error("Brak skonfigurowanych kluczy API Twittera");
    }

    if (!accessToken || !accessTokenSecret) {
      throw new Error("Brak tokenów dostępu do Twittera");
    }

    console.log("Twitter API debug:", {
      apiKeyLength: process.env.TWITTER_API_KEY.length,
      apiSecretLength: process.env.TWITTER_API_SECRET.length,
      accessTokenLength: accessToken.length,
      accessTokenSecretLength: accessTokenSecret.length,
    });

    const oauth = new OAuth({
      consumer: {
        key: process.env.TWITTER_API_KEY,
        secret: process.env.TWITTER_API_SECRET,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });

    // Jeśli są media, najpierw je wgraj
    const mediaIds: string[] = [];
    if (mediaUrls && mediaUrls.length > 0) {
      for (const media of mediaUrls) {
        const mediaData = await fetch(media.url).then((res) =>
          res.arrayBuffer()
        );
        const mediaBuffer = Buffer.from(mediaData);

        const mediaRequestData = {
          url: "https://upload.twitter.com/1.1/media/upload.json",
          method: "POST",
        };

        const mediaAuthorization = oauth.authorize(mediaRequestData, {
          key: accessToken,
          secret: accessTokenSecret,
        });

        // Wysyłanie INIT
        const initUrl = `${mediaRequestData.url}?command=INIT&total_bytes=${
          mediaBuffer.length
        }&media_type=${
          media.url.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i)
            ? "video/mp4"
            : "image/jpeg"
        }`;

        const initRequestData = {
          url: initUrl,
          method: "POST",
        };

        const initAuthorization = oauth.authorize(initRequestData, {
          key: accessToken,
          secret: accessTokenSecret,
        });

        console.log("Twitter media upload debug:", {
          initUrl,
          authorizationHeader: oauth.toHeader(initAuthorization).Authorization,
          accessTokenLength: accessToken?.length,
          accessTokenSecretLength: accessTokenSecret?.length,
        });

        const initResponse = await fetch(initUrl, {
          method: "POST",
          headers: {
            Authorization: oauth.toHeader(initAuthorization).Authorization,
          },
        });

        if (!initResponse.ok) {
          const errorData = await initResponse.json().catch(() => ({}));
          console.error("Twitter media upload INIT error:", {
            status: initResponse.status,
            statusText: initResponse.statusText,
            errorData: JSON.stringify(errorData, null, 2),
            mediaType: media.url.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i)
              ? "video/mp4"
              : "image/jpeg",
            fileSize: mediaBuffer.length,
            initUrl,
            authorizationHeader:
              oauth.toHeader(initAuthorization).Authorization,
          });
          throw new Error(
            `Błąd podczas inicjalizacji uploadu mediów: ${
              initResponse.status
            } ${initResponse.statusText} - ${JSON.stringify(errorData)}`
          );
        }

        const { media_id_string } = await initResponse.json();

        // Wysyłanie APPEND
        const appendResponse = await fetch(
          `${mediaRequestData.url}?command=APPEND&media_id=${media_id_string}&segment_index=0`,
          {
            method: "POST",
            headers: {
              Authorization: oauth.toHeader(mediaAuthorization).Authorization,
              "Content-Type": "application/octet-stream",
            },
            body: mediaBuffer,
          }
        );

        if (!appendResponse.ok) {
          throw new Error("Błąd podczas wysyłania mediów");
        }

        // Finalizacja uploadu
        const finalizeResponse = await fetch(
          `${mediaRequestData.url}?command=FINALIZE&media_id=${media_id_string}`,
          {
            method: "POST",
            headers: {
              Authorization: oauth.toHeader(mediaAuthorization).Authorization,
            },
          }
        );

        if (!finalizeResponse.ok) {
          throw new Error("Błąd podczas finalizacji uploadu mediów");
        }

        mediaIds.push(media_id_string);
      }
    }

    // Przygotuj dane do wysłania posta
    const tweetData = {
      text: content,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } }),
    };

    const tweetRequestData = {
      url: "https://api.twitter.com/2/tweets",
      method: "POST",
    };

    const tweetAuthorization = oauth.authorize(tweetRequestData, {
      key: accessToken,
      secret: accessTokenSecret,
    });

    const tweetResponse = await fetch(tweetRequestData.url, {
      method: "POST",
      headers: {
        Authorization: oauth.toHeader(tweetAuthorization).Authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetData),
    });

    if (!tweetResponse.ok) {
      const errorData = await tweetResponse.json();
      throw new Error(errorData.detail || "Błąd podczas publikacji posta");
    }

    const tweetResult = await tweetResponse.json();

    return NextResponse.json({
      success: true,
      data: tweetResult,
    });
  } catch (error) {
    console.error("Twitter API error:", error);
    return NextResponse.json(
      {
        error: "Wystąpił błąd podczas publikacji posta",
        details: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 }
    );
  }
}
