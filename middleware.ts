import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  console.log("Middleware - Path:", pathname);
  console.log("Middleware - Token:", token ? "exists" : "not found");

  // Przekieruj zalogowanych użytkowników z auth routes do dashboardu
  if (token && (pathname === "/sign-in" || pathname === "/sign-up")) {
    console.log("Middleware - Redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Przekieruj niezalogowanych użytkowników do strony logowania
  if (!token && pathname.startsWith("/dashboard")) {
    console.log("Middleware - Redirecting to sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/sign-in", "/sign-up"],
};
