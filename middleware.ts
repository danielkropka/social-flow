import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleRateLimit } from "@/lib/middleware/rateLimitMiddleware";

export async function middleware(request: NextRequest) {
  const rateLimitResponse = await handleRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  const { pathname } = request.nextUrl;

  const isSignIn = pathname === "/sign-in" || pathname === "/sign-in/";
  const isSignUp = pathname === "/sign-up" || pathname === "/sign-up/";
  const isDashboard = pathname.startsWith("/dashboard");
  const isSuccess = pathname === "/success" || pathname === "/success/";

  const needsAuthCheck = isSignIn || isSignUp || isDashboard || isSuccess;
  const token = needsAuthCheck
    ? await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    : null;

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
