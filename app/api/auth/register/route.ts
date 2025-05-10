import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
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
          gotFreeTrial: false,
        },
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
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Hasło musi zawierać przynajmniej jeden znak specjalny");
  }

  return {
    score,
    feedback,
  };
}
