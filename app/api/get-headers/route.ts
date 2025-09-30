import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    const headerList = await headers();
    if (!headerList) throw new Error("NoHeaderList");

    const referer = headerList.get("referer");

    return NextResponse.json({ referer });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "Unauthorized":
          return NextResponse.json(
            { error: "Nie jesteś zalogowany." },
            { status: 401 },
          );
        case "NoHeaderList":
          return NextResponse.json(
            {
              error:
                "Wewnętrzny błąd aplikacji podczas pobierania nagłówków. Zgłoś błąd do administratora aplikacji.",
            },
            { status: 500 },
          );
      }
    }
  }
}
