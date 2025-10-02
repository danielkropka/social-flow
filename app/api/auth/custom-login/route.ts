import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/middleware/rateLimitMiddleware";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Rate limiting
    const key = `auth-rate-limit:${email}`;
    const isAllowed = await checkRateLimit(key, 5, 60 * 60 * 1000);
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: "TooManyRequests" },
        { status: 429 }
      );
    }

    // Walidacja
    if (!email || !password) {
      return NextResponse.json(
        { error: "BadRequest" },
        { status: 400 }
      );
    }

    // Znajdź użytkownika
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "InvalidCredentials" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "NoPasswordSet" },
        { status: 422 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "EmailNotVerified" },
        { status: 422 }
      );
    }

    // Sprawdź hasło
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    
    if (!isCorrectPassword) {
      return NextResponse.json(
        { error: "InvalidCredentials" },
        { status: 401 }
      );
    }

    // Sukces - zwróć dane użytkownika
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "InternalServerError" },
      { status: 500 }
    );
  }
}