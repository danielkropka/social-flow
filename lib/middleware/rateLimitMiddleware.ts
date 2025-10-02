import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface EndPointConfig {
  path: string;
  config: RateLimitConfig;
}

const ENDPOINT_CONFIGS: EndPointConfig[] = [
  {
    path: "/api/media/upload",
    config: {
      maxRequests: 80,
      windowMs: 5 * 60 * 1000,
      message: "Zbyt wiele prób uploadu mediów. Spróbuj ponownie za 5 minut.",
    },
  },
  {
    path: "/api/posts/",
    config: {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000,
      message:
        "Zbyt wiele prób tworzenia postów. Spróbuj ponownie za 15 minut.",
    },
  },
  {
    path: "/api/billing/",
    config: {
      maxRequests: 10,
      windowMs: 30 * 60 * 1000,
      message:
        "Zbyt wiele prób dostępu do płatności. Spróbuj ponownie za 30 minut.",
    },
  },
];

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
  message: "Zbyt wiele prób dostępu. Spróbuj ponownie za 15 minut.",
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Function to handle rate limiting
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowMs / 1000);
  }
  return count <= limit;
}

export async function handleRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  if (!pathname || !pathname.startsWith("/api/")) {
    return null;
  }

  // Wyklucz NextAuth routes z middleware rate limitingu
  // NextAuth ma własną obsługę błędów
  if (pathname.startsWith("/api/auth/")) {
    return null;
  }

  const endpointConfig = ENDPOINT_CONFIGS.find((config) =>
    pathname.startsWith(config.path),
  );

  const config = endpointConfig?.config || DEFAULT_CONFIG;
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  const keySuffix =
    endpointConfig?.path.replace("/api/", "").replace("/", "") || "default";
  const redisKey = `rate-limit:${keySuffix}:${ip}`;

  const isAllowed = await checkRateLimit(
    redisKey,
    config.maxRequests,
    config.windowMs,
  );

  if (!isAllowed) {
    return NextResponse.json(
      {
        error: "TooManyRequests",
        message: config.message || DEFAULT_CONFIG.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
      },
      { status: 429 },
    );
  }

  return null;
}
