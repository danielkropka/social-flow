import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();

type Props = {
  params: {
    id: string;
  };
};

export async function DELETE(request: Request, props: Props) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    // Sprawdź, czy konto należy do zalogowanego użytkownika
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: props.params.id,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Nie znaleziono konta lub brak uprawnień" },
        { status: 404 }
      );
    }

    // Usuń konto
    await prisma.connectedAccount.delete({
      where: {
        id: props.params.id,
      },
    });

    return NextResponse.json(
      { message: "Konto zostało pomyślnie usunięte" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd podczas usuwania konta:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania konta" },
      { status: 500 }
    );
  }
}
