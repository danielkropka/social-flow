import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Przekieruj zalogowanych użytkowników z auth routes do dashboardu
  if (token && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    addSecurityHeaders(response);
    return response;
  }

  // Przekieruj niezalogowanych użytkowników do strony logowania
  if (!token && pathname.startsWith("/dashboard")) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    addSecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

// Funkcja pomocnicza do dodawania nagłówków bezpieczeństwa
function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self';"
  );
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
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
