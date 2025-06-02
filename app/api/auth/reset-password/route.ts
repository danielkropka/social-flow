import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/config/prisma";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { Resend } from "resend";

const RESET_TOKEN_EXPIRATION_MINUTES = 60; // 1h

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Nieprawidłowy email" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await hash(rawToken, 12);
      const expires = new Date(
        Date.now() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000
      );

      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: expires,
        },
      });

      const resetUrl = `${
        process.env.NEXT_PUBLIC_APP_URL
      }/reset-password?token=${encodeURIComponent(rawToken)}&uid=${user.id}`;
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "no-reply@" + process.env.NEXT_PUBLIC_MAIL_DOMAIN,
        to: email,
        subject: "Resetowanie hasła w Social Flow",
        html: `
          <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px 24px;">
              <h2 style="color: #2563eb; text-align: center; margin-bottom: 16px;">Resetowanie hasła</h2>
              <p style="font-size: 16px; color: #222; margin-bottom: 24px;">Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.<br> Aby ustawić nowe hasło, kliknij w poniższy przycisk:</p>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">Resetuj hasło</a>
              </div>
              <p style="font-size: 14px; color: #555;">Jeśli nie prosiłeś o reset hasła, po prostu zignoruj tę wiadomość.</p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #aaa; text-align: center;">Social Flow &copy; ${new Date().getFullYear()}</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({
      message:
        "Jeśli podany email istnieje w naszej bazie, wysłaliśmy instrukcję resetowania hasła.",
    });
  } catch (error) {
    console.error("Błąd resetowania hasła:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
