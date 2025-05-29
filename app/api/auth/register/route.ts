import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/config/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { withAuthRateLimit } from "@/middleware/rateLimit";
import { Resend } from "resend";

export async function POST(req: Request) {
  return withAuthRateLimit(async (req: Request) => {
    try {
      let body;
      try {
        body = await req.json();
      } catch (error: unknown) {
        console.error(
          "Błąd parsowania żądania:",
          error instanceof Error ? error.message : error
        );
        return NextResponse.json(
          {
            success: false,
            error: "InvalidRequest",
            message: "Nieprawidłowy format danych",
          },
          { status: 400 }
        );
      }

      const result = registerSchema.safeParse(body);
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

      const { firstName, lastName, email, password } = result.data;

      // Sprawdź czy użytkownik już istnieje
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "EmailExists",
            message: "Ten adres email jest już zarejestrowany",
          },
          { status: 400 }
        );
      }

      // Sprawdź siłę hasła
      const passwordStrength = checkPasswordStrength(password);
      if (passwordStrength.score < 3) {
        return NextResponse.json(
          {
            success: false,
            error: "WeakPassword",
            message: "Hasło jest zbyt słabe",
            details: passwordStrength.feedback,
          },
          { status: 400 }
        );
      }

      try {
        // Hashuj hasło
        const hashedPassword = await hash(password, 12);

        // Utwórz użytkownika
        const user = await db.user.create({
          data: {
            name: `${firstName} ${lastName}`,
            email,
            password: hashedPassword,
          },
        });

        // Generuj token weryfikacyjny
        const crypto = await import("crypto");
        const rawToken = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        await db.emailVerificationToken.create({
          data: {
            userId: user.id,
            token: rawToken,
            expiresAt: expires,
          },
        });
        const verifyUrl = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/verify-email?token=${encodeURIComponent(rawToken)}&uid=${user.id}`;

        // Wysyłka maila przez Resend
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "no-reply@" + process.env.NEXT_PUBLIC_MAIL_DOMAIN,
          to: email,
          subject: "Weryfikacja adresu email w Social Flow",
          html: `
            <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
              <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px 24px;">
                <h2 style="color: #2563eb; text-align: center; margin-bottom: 16px;">Witaj w Social Flow!</h2>
                <p style="font-size: 16px; color: #222; margin-bottom: 24px;">Dziękujemy za rejestrację.<br> Aby aktywować swoje konto, potwierdź swój adres email klikając w poniższy przycisk:</p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">Zweryfikuj email</a>
                </div>
                <p style="font-size: 14px; color: #555;">Jeśli nie rejestrowałeś się w Social Flow, po prostu zignoruj tę wiadomość.</p>
                <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">Social Flow &copy; ${new Date().getFullYear()}</p>
              </div>
            </div>
          `,
        });

        return NextResponse.json(
          {
            success: true,
            message: "Konto zostało utworzone pomyślnie",
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          },
          { status: 201 }
        );
      } catch (dbError: unknown) {
        console.error(
          "Błąd bazy danych:",
          dbError instanceof Error ? dbError.message : dbError
        );
        return NextResponse.json(
          {
            success: false,
            error: "DatabaseError",
            message: "Wystąpił błąd podczas tworzenia konta",
          },
          { status: 500 }
        );
      }
    } catch (error: unknown) {
      console.error(
        "Błąd serwera:",
        error instanceof Error ? error.message : error
      );
      return NextResponse.json(
        {
          success: false,
          error: "ServerError",
          message: "Wystąpił błąd podczas rejestracji",
        },
        { status: 500 }
      );
    }
  })(req);
}

function checkPasswordStrength(password: string) {
  const feedback: string[] = [];
  let score = 0;

  // Długość hasła
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Hasło musi mieć minimum 8 znaków");
  }

  // Wielkie litery
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Hasło musi zawierać przynajmniej jedną wielką literę");
  }

  // Małe litery
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Hasło musi zawierać przynajmniej jedną małą literę");
  }

  // Cyfry
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Hasło musi zawierać przynajmniej jedną cyfrę");
  }

  // Znaki specjalne
  if (/[!@#$%^&*(),.?":{}|<>_\-+=/\\'`;~`]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Hasło musi zawierać przynajmniej jeden znak specjalny");
  }

  return {
    score,
    feedback,
  };
}
