import { NextResponse } from "next/server";
import { db } from "@/lib/config/prisma";
import { compare, hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, uid, newPassword } = await req.json();
    if (
      !token ||
      !uid ||
      !newPassword ||
      typeof token !== "string" ||
      typeof uid !== "string" ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Brak wymaganych danych" },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Hasło musi mieć minimum 8 znaków" },
        { status: 400 }
      );
    }
    // Szukamy tokenu w bazie
    const resetToken = await db.passwordResetToken.findFirst({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
    });
    if (!resetToken) {
      return NextResponse.json(
        { error: "Nieprawidłowy lub wygasły token" },
        { status: 400 }
      );
    }
    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json(
        { error: "Token wygasł. Wygeneruj nowy link." },
        { status: 400 }
      );
    }
    // Porównujemy hash tokenu
    const isValid = await compare(token, resetToken.token);
    if (!isValid) {
      return NextResponse.json(
        { error: "Nieprawidłowy token" },
        { status: 400 }
      );
    }
    // Ustawiamy nowe hasło
    const hashedPassword = await hash(newPassword, 12);
    await db.user.update({
      where: { id: uid },
      data: { password: hashedPassword },
    });
    // Usuwamy token (jednorazowość)
    await db.passwordResetToken.delete({ where: { id: resetToken.id } });
    return NextResponse.json({
      message: "Hasło zostało zresetowane. Możesz się teraz zalogować.",
    });
  } catch (error) {
    console.error("Błąd resetowania hasła:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
