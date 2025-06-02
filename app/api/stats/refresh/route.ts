import { NextResponse } from "next/server";
import { refreshAllStats } from "@/lib/utils/refreshAllStats";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Brak autoryzacji" },
        { status: 401 }
      );
    }
    const results = await refreshAllStats(session.user.id);
    return NextResponse.json({
      message: "Statystyki dla wszystkich platform zostały odświeżone.",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Wystąpił nieoczekiwany błąd podczas odświeżania statystyk.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
