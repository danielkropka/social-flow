import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/config/prisma";
import { ConnectedAccount } from "@prisma/client";
import { decryptToken } from "@/lib/utils/utils";

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
  private account: ConnectedAccount;

  /**
   * Konwertuje tablicę media IDs na odpowiedni typ dla Twitter API
   */
  private formatMediaIds(
    mediaIds: string[],
  ):
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string] {
    if (mediaIds.length === 1) return [mediaIds[0]];
    if (mediaIds.length === 2) return [mediaIds[0], mediaIds[1]];
    if (mediaIds.length === 3) return [mediaIds[0], mediaIds[1], mediaIds[2]];
    return [mediaIds[0], mediaIds[1], mediaIds[2], mediaIds[3]];
  }

  constructor(account: ConnectedAccount) {
    if (!account.accessToken || !account.accessSecret) {
      throw new Error("Brak tokenów dostępu do Twitter API");
    }

    this.account = account;
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: decryptToken(account.accessToken),
      accessSecret: decryptToken(account.accessSecret),
    });
  }

  /**
   * Sprawdza czy tokeny są ważne i aktualizuje status konta w przypadku błędu
   */
  private async validateTokens(): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.client.v2.me({ "user.fields": ["id", "username", "name"] });
      return { valid: true };
    } catch (error: unknown) {
      console.error("Twitter token validation error:", error);

      let errorMessage = "Nie można zweryfikować tokenów Twitter/X";
      let shouldUpdateStatus = false;

      const twitterError = error as TwitterApiError;
      if (twitterError?.code === 401) {
        errorMessage =
          "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        shouldUpdateStatus = true;
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do konta Twitter/X";
        shouldUpdateStatus = true;
      } else if (error instanceof Error) {
        if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
          shouldUpdateStatus = true;
        } else if (
          error.message.includes("forbidden") ||
          error.message.includes("403")
        ) {
          errorMessage = "Brak uprawnień do konta Twitter/X";
          shouldUpdateStatus = true;
        }
      }

      // Aktualizuj status konta w bazie danych jeśli tokeny są nieważne
      if (shouldUpdateStatus) {
        try {
          await db.connectedAccount.update({
            where: { id: this.account.id },
            data: {
              status: "EXPIRED",
              lastErrorAt: new Date(),
              lastErrorMessage: errorMessage,
            },
          });
        } catch (dbError) {
          console.error("Failed to update account status:", dbError);
        }
      }

      return { valid: false, error: errorMessage };
    }
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

      // Sprawdź czy tokeny są ważne przed publikacją
      const tokenValidation = await this.validateTokens();
      if (!tokenValidation.valid) {
        return {
          success: false,
          message: tokenValidation.error || "Błąd weryfikacji konta Twitter/X",
          error: "TOKEN_EXPIRED",
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
        errorMessage =
          "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        errorCode = "UNAUTHORIZED";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do publikacji na Twitter/X";
        errorCode = "FORBIDDEN";
      } else if (twitterError?.code === 429) {
        errorMessage =
          "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
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

      // Sprawdź czy tokeny są ważne przed publikacją
      const tokenValidation = await this.validateTokens();
      if (!tokenValidation.valid) {
        return {
          success: false,
          message: tokenValidation.error || "Błąd weryfikacji konta Twitter/X",
          error: "TOKEN_EXPIRED",
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
        errorMessage =
          "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        errorCode = "UNAUTHORIZED";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do publikacji na Twitter/X";
        errorCode = "FORBIDDEN";
      } else if (twitterError?.code === 429) {
        errorMessage =
          "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
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

      // Sprawdź czy tokeny są ważne przed publikacją
      const tokenValidation = await this.validateTokens();
      if (!tokenValidation.valid) {
        return {
          success: false,
          message: tokenValidation.error || "Błąd weryfikacji konta Twitter/X",
          error: "TOKEN_EXPIRED",
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
        errorMessage =
          "Token dostępu wygasł lub jest nieprawidłowy. Połącz konto ponownie";
        errorCode = "UNAUTHORIZED";
      } else if (twitterError?.code === 403) {
        errorMessage = "Brak uprawnień do publikacji na Twitter/X";
        errorCode = "FORBIDDEN";
      } else if (twitterError?.code === 429) {
        errorMessage =
          "Przekroczono limit publikacji na Twitter/X. Spróbuj ponownie później";
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
      // Pobieramy plik z URL (AWS S3 lub innego źródła)
      const response = await fetch(mediaUrl, {
        headers: {
          "User-Agent": "SocialFlow/1.0",
        },
        // Dodajemy timeout dla dużych plików
        signal: AbortSignal.timeout(30000), // 30 sekund timeout
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Nie można pobrać pliku z URL: ${response.status} ${response.statusText}`,
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

      // Sprawdzamy czy plik nie jest pusty
      if (buffer.length === 0) {
        return {
          success: false,
          error: "Plik jest pusty",
        };
      }

      // Określamy typ MIME na podstawie URL lub nagłówków
      let mimeType = response.headers.get("content-type");
      if (!mimeType) {
        // Fallback na podstawie rozszerzenia URL
        const urlPath = new URL(mediaUrl).pathname.toLowerCase();
        if (urlPath.includes(".jpg") || urlPath.includes(".jpeg")) {
          mimeType = "image/jpeg";
        } else if (urlPath.includes(".png")) {
          mimeType = "image/png";
        } else if (urlPath.includes(".gif")) {
          mimeType = "image/gif";
        } else if (urlPath.includes(".webp")) {
          mimeType = "image/webp";
        } else if (urlPath.includes(".mp4")) {
          mimeType = "video/mp4";
        } else {
          mimeType = mediaType === "image" ? "image/jpeg" : "video/mp4";
        }
      }

      // Przesyłamy media do Twitter API
      const mediaId = await this.client.v1.uploadMedia(buffer, {
        mimeType: mimeType,
      });

      return {
        success: true,
        mediaId: mediaId,
      };
    } catch (error) {
      console.error("Twitter media upload error:", error);

      let errorMessage = "Nieznany błąd podczas przesyłania mediów";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Timeout podczas pobierania pliku";
        } else if (error.message.includes("file size")) {
          errorMessage = "Plik jest za duży dla Twitter/X";
        } else if (error.message.includes("unsupported")) {
          errorMessage = "Nieobsługiwany format pliku";
        } else if (error.message.includes("ECONNREFUSED")) {
          errorMessage = "Brak połączenia z serwerem";
        } else if (error.message.includes("ENOTFOUND")) {
          errorMessage = "Nie można znaleźć pliku";
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
    return await this.validateTokens();
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
