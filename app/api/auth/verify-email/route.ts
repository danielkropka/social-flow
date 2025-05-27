import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";

export async function POST(req: Request) {
  try {
    const { token, uid } = await req.json();
    if (
      !token ||
      !uid ||
      typeof token !== "string" ||
      typeof uid !== "string"
    ) {
      return NextResponse.json(
        { error: "Brak wymaganych danych" },
        { status: 400 }
      );
    }
    // Szukamy tokenu w bazie
    const verifyToken = await db.emailVerificationToken.findFirst({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
    });
    if (!verifyToken) {
      return NextResponse.json(
        { error: "Nieprawidłowy lub wygasły token" },
        { status: 400 }
      );
    }
    if (verifyToken.expiresAt < new Date()) {
      await db.emailVerificationToken.delete({ where: { id: verifyToken.id } });
      return NextResponse.json(
        { error: "Token wygasł. Wygeneruj nowy link." },
        { status: 400 }
      );
    }
    if (verifyToken.token !== token) {
      return NextResponse.json(
        { error: "Nieprawidłowy token" },
        { status: 400 }
      );
    }
    // Ustawiamy emailVerified
    await db.user.update({
      where: { id: uid },
      data: { emailVerified: new Date() },
    });
    // Usuwamy token (jednorazowość)
    await db.emailVerificationToken.delete({ where: { id: verifyToken.id } });
    return NextResponse.json({
      message: "Email został zweryfikowany. Możesz się teraz zalogować.",
    });
  } catch (error) {
    console.error("Błąd weryfikacji emaila:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
