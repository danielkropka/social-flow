import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/config/prisma";
import { ConnectedAccount } from "@prisma/client";

export interface TwitterPublishResult {
  success: boolean;
  message: string;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

export interface TwitterMediaUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

export interface TwitterApiError extends Error {
  code?: number;
  status?: number;
  data?: {
    detail?: string;
    title?: string;
  };
}

export class TwitterPublisher {
  private client: TwitterApi;

  /**
   * Konwertuje tablicę media IDs na odpowiedni typ dla Twitter API
   */
  private formatMediaIds(mediaIds: string[]): [string] | [string, string] | [string, string, string] | [string, string, string, string] {
    if (mediaIds.length === 1) return [mediaIds[0]];
    if (mediaIds.length === 2) return [mediaIds[0], mediaIds[1]];
    if (mediaIds.length === 3) return [mediaIds[0], mediaIds[1], mediaIds[2]];
    return [mediaIds[0], mediaIds[1], mediaIds[2], mediaIds[3]];
  }

  constructor(account: ConnectedAccount) {
    if (!account.accessToken || !account.accessSecret) {
      throw new Error("Brak tokenów dostępu do Twitter API");
    }

    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: account.accessToken,
      accessSecret: account.accessSecret,
    });
  }

  /**
   * Publikuje post tekstowy na Twitter/X
   */
  async publishTextPost(content: string): Promise<TwitterPublishResult> {
    try {
      // Sprawdź długość tekstu (Twitter ma limit 280 znaków)
      if (content.length > 280) {
        return {
          success: false,
          message: "Tekst posta przekracza limit 280 znaków dla Twitter/X",
          error: "TEXT_TOO_LONG",
        };
      }

      const tweet = await this.client.v2.tweet(content);

      return {
        success: true,
        message: "Post został pomyślnie opublikowany na Twitter/X",
        tweetId: tweet.data.id,
        tweetUrl: `https://twitter.com/user/status/${tweet.data.id}`,
      };
    } catch (error: unknown) {
      console.error("Twitter publish error:", error);

      let errorMessage = "Nieznany błąd podczas publikacji na Twitter/X";
      let errorCode = "UNKNOWN_ERROR";

      // Sprawdź kod błędu z Twitter API
      const twitterError = error as TwitterApiError;
      if (twitterError?.code === 401) {
        errorMessage = "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        errorCode = "UNAUTHORIZED";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do publikacji na Twitter/X";
        errorCode = "FORBIDDEN";
      } else if (twitterError?.code === 429) {
        errorMessage = "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
        errorCode = "RATE_LIMIT";
      } else if (error instanceof Error) {
        if (error.message.includes("duplicate")) {
          errorMessage = "Ten post został już opublikowany na Twitter/X";
          errorCode = "DUPLICATE_TWEET";
        } else if (error.message.includes("rate limit")) {
          errorMessage =
            "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
          errorCode = "RATE_LIMIT";
        } else if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Brak autoryzacji do publikacji na Twitter/X. Połącz konto ponownie";
          errorCode = "UNAUTHORIZED";
        } else if (
          error.message.includes("forbidden") ||
          error.message.includes("403")
        ) {
          errorMessage = "Brak uprawnień do publikacji na Twitter/X";
          errorCode = "FORBIDDEN";
        } else {
          errorMessage = `Błąd Twitter API: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorCode,
      };
    }
  }

  /**
   * Publikuje post ze zdjęciami na Twitter/X
   */
  async publishImagePost(
    content: string,
    imageUrls: string[],
  ): Promise<TwitterPublishResult> {
    try {
      // Sprawdź długość tekstu
      if (content.length > 280) {
        return {
          success: false,
          message: "Tekst posta przekracza limit 280 znaków dla Twitter/X",
          error: "TEXT_TOO_LONG",
        };
      }

      // Sprawdź liczbę zdjęć (Twitter pozwala na maksymalnie 4 zdjęcia)
      if (imageUrls.length > 4) {
        return {
          success: false,
          message: "Twitter/X pozwala na maksymalnie 4 zdjęcia w poście",
          error: "TOO_MANY_IMAGES",
        };
      }

      // Przesyłamy zdjęcia do Twitter API
      const mediaIds: string[] = [];

      for (const imageUrl of imageUrls) {
        const uploadResult = await this.uploadMedia(imageUrl, "image");
        if (!uploadResult.success || !uploadResult.mediaId) {
          return {
            success: false,
            message: `Błąd podczas przesyłania zdjęcia: ${uploadResult.error}`,
            error: "MEDIA_UPLOAD_FAILED",
          };
        }
        mediaIds.push(uploadResult.mediaId);
      }

      // Publikujemy post ze zdjęciami
      const tweet = await this.client.v2.tweet(content, {
        media: {
          media_ids: this.formatMediaIds(mediaIds),
        },
      });

      return {
        success: true,
        message: "Post ze zdjęciami został pomyślnie opublikowany na Twitter/X",
        tweetId: tweet.data.id,
        tweetUrl: `https://twitter.com/user/status/${tweet.data.id}`,
      };
    } catch (error: unknown) {
      console.error("Twitter image publish error:", error);

      let errorMessage =
        "Nieznany błąd podczas publikacji posta ze zdjęciami na Twitter/X";
      let errorCode = "UNKNOWN_ERROR";

      // Sprawdź kod błędu z Twitter API
      const twitterError = error as TwitterApiError;
      if (twitterError?.code === 401) {
        errorMessage = "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        errorCode = "UNAUTHORIZED";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do publikacji na Twitter/X";
        errorCode = "FORBIDDEN";
      } else if (twitterError?.code === 429) {
        errorMessage = "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
        errorCode = "RATE_LIMIT";
      } else if (error instanceof Error) {
        if (error.message.includes("duplicate")) {
          errorMessage = "Ten post został już opublikowany na Twitter/X";
          errorCode = "DUPLICATE_TWEET";
        } else if (error.message.includes("rate limit")) {
          errorMessage =
            "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
          errorCode = "RATE_LIMIT";
        } else if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Brak autoryzacji do publikacji na Twitter/X. Połącz konto ponownie";
          errorCode = "UNAUTHORIZED";
        } else if (
          error.message.includes("forbidden") ||
          error.message.includes("403")
        ) {
          errorMessage = "Brak uprawnień do publikacji na Twitter/X";
          errorCode = "FORBIDDEN";
        } else {
          errorMessage = `Błąd Twitter API: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorCode,
      };
    }
  }

  /**
   * Publikuje post z filmem na Twitter/X
   */
  async publishVideoPost(
    content: string,
    videoUrl: string,
  ): Promise<TwitterPublishResult> {
    try {
      // Sprawdź długość tekstu
      if (content.length > 280) {
        return {
          success: false,
          message: "Tekst posta przekracza limit 280 znaków dla Twitter/X",
          error: "TEXT_TOO_LONG",
        };
      }

      // Przesyłamy film do Twitter API
      const uploadResult = await this.uploadMedia(videoUrl, "video");
      if (!uploadResult.success || !uploadResult.mediaId) {
        return {
          success: false,
          message: `Błąd podczas przesyłania filmu: ${uploadResult.error}`,
          error: "MEDIA_UPLOAD_FAILED",
        };
      }

      // Publikujemy post z filmem
      const tweet = await this.client.v2.tweet(content, {
        media: {
          media_ids: this.formatMediaIds([uploadResult.mediaId]),
        },
      });

      return {
        success: true,
        message: "Post z filmem został pomyślnie opublikowany na Twitter/X",
        tweetId: tweet.data.id,
        tweetUrl: `https://twitter.com/user/status/${tweet.data.id}`,
      };
    } catch (error: unknown) {
      console.error("Twitter video publish error:", error);

      let errorMessage =
        "Nieznany błąd podczas publikacji posta z filmem na Twitter/X";
      let errorCode = "UNKNOWN_ERROR";

      // Sprawdź kod błędu z Twitter API
      const twitterError = error as TwitterApiError;
      if (twitterError?.code === 401) {
        errorMessage = "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        errorCode = "UNAUTHORIZED";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do publikacji na Twitter/X";
        errorCode = "FORBIDDEN";
      } else if (twitterError?.code === 429) {
        errorMessage = "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
        errorCode = "RATE_LIMIT";
      } else if (error instanceof Error) {
        if (error.message.includes("duplicate")) {
          errorMessage = "Ten post został już opublikowany na Twitter/X";
          errorCode = "DUPLICATE_TWEET";
        } else if (error.message.includes("rate limit")) {
          errorMessage =
            "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
          errorCode = "RATE_LIMIT";
        } else if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Brak autoryzacji do publikacji na Twitter/X. Połącz konto ponownie";
          errorCode = "UNAUTHORIZED";
        } else if (
          error.message.includes("forbidden") ||
          error.message.includes("403")
        ) {
          errorMessage = "Brak uprawnień do publikacji na Twitter/X";
          errorCode = "FORBIDDEN";
        } else {
          errorMessage = `Błąd Twitter API: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorCode,
      };
    }
  }

  /**
   * Przesyła media (zdjęcie lub film) do Twitter API
   */
  private async uploadMedia(
    mediaUrl: string,
    mediaType: "image" | "video",
  ): Promise<TwitterMediaUploadResult> {
    try {
      // Pobieramy plik z URL
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `Nie można pobrać pliku z URL: ${response.statusText}`,
        };
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Sprawdzamy rozmiar pliku
      const maxSize =
        mediaType === "image" ? 5 * 1024 * 1024 : 512 * 1024 * 1024; // 5MB dla zdjęć, 512MB dla filmów
      if (buffer.length > maxSize) {
        return {
          success: false,
          error: `Plik jest za duży. Maksymalny rozmiar dla ${mediaType === "image" ? "zdjęć" : "filmów"}: ${maxSize / (1024 * 1024)}MB`,
        };
      }

      // Przesyłamy media do Twitter API
      const mediaId = await this.client.v1.uploadMedia(buffer, {
        mimeType:
          response.headers.get("content-type") ||
          (mediaType === "image" ? "image/jpeg" : "video/mp4"),
      });

      return {
        success: true,
        mediaId: mediaId,
      };
    } catch (error) {
      console.error("Twitter media upload error:", error);

      let errorMessage = "Nieznany błąd podczas przesyłania mediów";
      if (error instanceof Error) {
        if (error.message.includes("file size")) {
          errorMessage = "Plik jest za duży dla Twitter/X";
        } else if (error.message.includes("unsupported")) {
          errorMessage = "Nieobsługiwany format pliku";
        } else {
          errorMessage = `Błąd przesyłania mediów: ${error.message}`;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sprawdza czy konto jest aktywne i ma odpowiednie uprawnienia
   */
  async verifyAccount(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.client.v2.me({ "user.fields": ["id", "username", "name"] });
      return { valid: true };
    } catch (error: unknown) {
      console.error("Twitter account verification error:", error);

      let errorMessage = "Nie można zweryfikować konta Twitter/X";
      
      // Sprawdź kod błędu z Twitter API
      const twitterError = error as TwitterApiError;
      if (twitterError?.code === 401) {
        errorMessage = "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do konta Twitter/X";
      } else if (twitterError?.code === 429) {
        errorMessage = "Przekroczono limit zapytań do Twitter API. Spróbuj ponownie później";
      } else if (error instanceof Error) {
        if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage = "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        } else if (
          error.message.includes("forbidden") ||
          error.message.includes("403")
        ) {
          errorMessage = "Brak uprawnień do konta Twitter/X";
        } else {
          errorMessage = `Błąd weryfikacji: ${error.message}`;
        }
      }

      return { valid: false, error: errorMessage };
    }
  }
}

/**
 * Factory function do tworzenia TwitterPublisher dla danego konta
 */
export async function createTwitterPublisher(
  accountId: string,
  userId: string,
): Promise<TwitterPublisher> {
  const account = await db.connectedAccount.findFirst({
    where: {
      id: accountId,
      userId: userId,
      provider: "TWITTER",
      status: "ACTIVE",
    },
  });

  if (!account) {
    throw new Error("Nie znaleziono aktywnego konta Twitter/X");
  }

  if (!account.accessToken || !account.accessSecret) {
    throw new Error("Brak tokenów dostępu do konta Twitter/X");
  }

  return new TwitterPublisher(account);
}
