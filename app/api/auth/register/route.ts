import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;

    const hashedPassword = await hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        plan: "free",
        planStatus: "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Registration failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
