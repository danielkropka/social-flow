import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/config/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    const accounts = await prisma.connectedAccount.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Błąd podczas pobierania kont:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania kont" },
      { status: 500 }
    );
  }
}
