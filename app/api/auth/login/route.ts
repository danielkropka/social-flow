import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Brakujące dane" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Nieprawidłowy email lub hasło" },
        { status: 401 }
      );
    }

    // Sprawdź czy konto zostało utworzone przez Google
    if (!user.password) {
      return NextResponse.json(
        { message: "To konto zostało utworzone przez Google" },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Nieprawidłowy email lub hasło" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Wystąpił błąd podczas logowania" },
      { status: 500 }
    );
  }
}
