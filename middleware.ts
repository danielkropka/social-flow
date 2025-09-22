import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isSignIn = pathname === "/sign-in" || pathname === "/sign-in/";
  const isSignUp = pathname === "/sign-up" || pathname === "/sign-up/";
  const isDashboard = pathname.startsWith("/dashboard");
  const isSuccess = pathname === "/success" || pathname === "/success/";

  const needsAuthCheck = isSignIn || isSignUp || isDashboard || isSuccess;
  const token = needsAuthCheck
    ? await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    : null;

  // Debug logging
  if (isDashboard) {
    console.log("Middleware - Dashboard access:", {
      pathname,
      hasToken: !!token,
      tokenId: token?.id,
      tokenEmail: token?.email,
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET"
    });
  }

  if (token && (isSignIn || isSignUp)) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    addSecurityHeaders(response);
    return response;
  }

  if (!token && isDashboard) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    addSecurityHeaders(response);
    return response;
  }

  if (isSuccess) {
    if (!token) {
      const response = NextResponse.redirect(new URL("/sign-in", request.url));
      addSecurityHeaders(response);
      return response;
    }

    // Uwaga: referer może być pusty; zostawiamy jak było, ale warto rozważyć weryfikację parametru state.
    const referer = request.headers.get("referer");
    if (!referer || !referer.includes("stripe.com")) {
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      addSecurityHeaders(response);
      return response;
    }
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  const isProd = process.env.NODE_ENV === "production";

  const cspParts = [
    "default-src 'self' https:",
    // W produkcji bez 'unsafe-eval'; w dev potrzebne dla React Refresh/HMR
    `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval'"} https://js.stripe.com`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    // W dev dodaj ws: wss: dla HMR
    `connect-src 'self' https:${isProd ? "" : " ws: wss:"}`.trim(),
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'self'",
  ];

  response.headers.set("Content-Security-Policy", cspParts.join("; "));
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
}

export const config = {
  // Zachowujemy dotychczasowe ścieżki — middleware nie dotyka /api (w tym /api/auth) ani zasobów Nexta
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-in/", "/sign-up", "/sign-up/", "/success", "/success/"],
};
