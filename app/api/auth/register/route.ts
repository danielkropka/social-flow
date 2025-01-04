import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;

    const hashedPassword = await hash(password, 10);

    await db.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        subscriptionType: "FREE",
        subscriptionStatus: "INACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
    });
  } catch (error: Error | unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
