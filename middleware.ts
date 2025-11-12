import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleRateLimit } from "@/lib/middleware/rateLimitMiddleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname && pathname.startsWith("/api/")) {
    // Continue with rate limiting for API routes
    const rateLimitResponse = await handleRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return NextResponse.next();
  }

  const isSignIn = pathname && pathname.startsWith("/sign-in");
  const isSignUp = pathname && pathname.startsWith("/sign-up");
  const isDashboard = pathname && pathname.startsWith("/dashboard");
  const isSuccess = pathname && pathname.startsWith("/success");

  const needsAuthCheck = isSignIn || isSignUp || isDashboard || isSuccess;
  
  if (!needsAuthCheck) {
    return NextResponse.next();
  }

  // Sprawdź czy NEXTAUTH_SECRET jest dostępny
  if (!process.env.NEXTAUTH_SECRET) {
    console.error("NEXTAUTH_SECRET is not defined in middleware");
    if (isDashboard) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (token && (isSignIn || isSignUp)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isSuccess) {
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const referer = request.headers.get("referer");
    if (!referer || !referer.includes("stripe.com")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in/",
    "/sign-up/",
    "/success/",
    "/api/:path*",
  ],
};
