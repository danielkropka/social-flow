import { hash } from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/config/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { Resend } from "resend";

interface CredentialsRequestBody {
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  action: "register";
}

async function generateToken() {
  const crypto = await import("crypto");
  return crypto.randomBytes(32).toString("hex");
}

function getEmailVerificationHtml(userName: string, verifyUrl: string): string {
  const year = new Date().getFullYear();
  return `
    <html lang="pl">
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4; min-height: 100vh;">
          <tr>
            <td align="center">
              <table width="600" style="background: #fff; border-radius: 8px; margin: 40px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <h2 style="color: #222; margin-bottom: 16px;">Witaj${userName ? `, ${userName}` : ""}!</h2>
                    <p style="color: #444; font-size: 16px; margin-bottom: 24px;">
                      Dziękujemy za rejestrację w Social Flow.<br />
                      Aby dokończyć proces rejestracji, potwierdź swój adres e-mail klikając w poniższy przycisk:
                    </p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #fff; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 24px;">Potwierdź adres e-mail</a>
                    <p style="color: #888; font-size: 13px; margin-top: 32px;">
                      Jeśli nie rejestrowałeś(-aś) się w Social Flow, zignoruj tę wiadomość.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 40px 40px; text-align: center; color: #aaa; font-size: 12px;">
                    &copy; ${year} Social Flow. Wszelkie prawa zastrzeżone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CredentialsRequestBody;

  switch (body.action) {
    case "register":
      try {
        const result = registerSchema.safeParse(body.data);

        if (!result.success) {
          return NextResponse.json(
            {
              error: "ValidationError",
              details: result.error.errors.map((err) => err.message),
            },
            { status: 400 },
          );
        }

        const { email, password, firstName, lastName } = result.data;

        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return NextResponse.json(
            {
              error: "UserAlreadyExists",
              message: "Konto z tym adresem e-mail już istnieje.",
            },
            { status: 409 },
          );
        }

        const hashedPassword = await hash(password, 12);

        const user = await db.user.create({
          data: {
            name: `${firstName} ${lastName}`,
            email,
            password: hashedPassword,
          },
        });

        const rawToken = await generateToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.emailVerificationToken.create({
          data: {
            userId: user.id,
            token: rawToken,
            expiresAt: expires,
          },
        });

        const verifyUrl = `${
          process.env.NEXT_PUBLIC_APP_URL
        }/verify-email?token=${encodeURIComponent(rawToken)}&uid=${user.id}`;

        const html = getEmailVerificationHtml(firstName, verifyUrl);

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "no-reply@" + process.env.NEXT_PUBLIC_MAIL_DOMAIN,
          to: email,
          subject: "Potwierdź swój adres e-mail w Social Flow",
          html,
        });

        return NextResponse.json({
          success: true,
          createdUser: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        });
      } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
          {
            error: "InternalServerError",
            message: "Wystąpił nieoczekiwany błąd podczas rejestracji",
          },
          { status: 500 },
        );
      }
    default:
      return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  }
}
