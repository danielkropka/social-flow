import { compare } from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/config/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { withAuthRateLimit } from "@/middleware/rateLimit";

export async function POST(req: NextRequest) {
  return withAuthRateLimit(async (req: NextRequest) => {
    try {
      const body = await req.json();

      // Walidacja danych wejściowych
      const result = loginSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: "ValidationError",
            details: result.error.errors.map((err) => err.message),
          },
          { status: 400 }
        );
      }

      const { email, password } = result.data;

      // Sprawdzenie czy użytkownik istnieje
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          emailVerified: true,
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "InvalidCredentials",
            message: "Nieprawidłowy email lub hasło",
          },
          { status: 401 }
        );
      }

      // Sprawdzenie czy konto zostało utworzone przez Google
      const hasGoogleAccount = user.accounts.some(
        (account) => account.provider === "google"
      );
      if (hasGoogleAccount) {
        return NextResponse.json(
          {
            success: false,
            error: "GoogleAccount",
            message:
              "To konto zostało utworzone przez Google. Użyj przycisku 'Kontynuuj z Google' aby się zalogować.",
          },
          { status: 400 }
        );
      }

      // Sprawdzenie czy email został zweryfikowany
      if (!user.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: "EmailNotVerified",
            message:
              "Twój email nie został jeszcze zweryfikowany. Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny.",
          },
          { status: 400 }
        );
      }

      // Sprawdzenie czy hasło istnieje
      if (!user.password) {
        return NextResponse.json(
          {
            success: false,
            error: "InvalidCredentials",
            message: "Nieprawidłowy email lub hasło",
          },
          { status: 401 }
        );
      }

      // Sprawdzenie poprawności hasła
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            error: "InvalidCredentials",
            message: "Nieprawidłowy email lub hasło",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Zalogowano pomyślnie",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Login error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "InternalServerError",
          message: "Wystąpił nieoczekiwany błąd podczas logowania",
        },
        { status: 500 }
      );
    }
  })(req);
}
