import { NextResponse, type NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

// Inicjalizacja Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Konfiguracja rate limitera dla API
export const apiLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 requestów na okno
};

// Konfiguracja rate limitera dla endpointów autoryzacji
export const authLimiter = {
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 5, // limit 5 prób na godzinę
};

// Funkcja pomocnicza do sprawdzania limitu
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, Math.ceil(windowMs / 1000));
  }

  return count <= limit;
}

// Middleware do obsługi rate limitingu dla middleware
export const withMiddlewareRateLimit = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const key = `rate-limit:${ip}`;

    const isAllowed = await checkRateLimit(
      key,
      apiLimiter.max,
      apiLimiter.windowMs
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: "TooManyRequests",
          message: "Zbyt wiele prób dostępu. Spróbuj ponownie później.",
        },
        { status: 429 }
      );
    }

    return handler(req);
  };
};

// Middleware do obsługi rate limitingu dla Route Handlers
export const withRateLimit = async (handler: () => Promise<NextResponse>) => {
  const key = `rate-limit:api`;

  const isAllowed = await checkRateLimit(
    key,
    apiLimiter.max,
    apiLimiter.windowMs
  );

  if (!isAllowed) {
    return NextResponse.json(
      {
        error: "TooManyRequests",
        message: "Zbyt wiele prób dostępu. Spróbuj ponownie później.",
      },
      { status: 429 }
    );
  }

  return handler();
};

// Middleware do obsługi rate limitingu dla autoryzacji
export const withAuthRateLimit = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const key = `auth-rate-limit:${ip}`;

    const isAllowed = await checkRateLimit(
      key,
      authLimiter.max,
      authLimiter.windowMs
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: "TooManyAuthAttempts",
          message: "Zbyt wiele prób logowania. Spróbuj ponownie później.",
        },
        { status: 429 }
      );
    }

    return handler(req);
  };
};
