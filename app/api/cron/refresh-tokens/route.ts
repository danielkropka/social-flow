import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function refreshInstagramToken(accessToken: string) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.access_token) {
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error("Błąd podczas odświeżania tokenu Instagram:", error);
    return null;
  }
}

export async function GET() {
  try {
    // Pobierz wszystkie konta Instagram, których token wygasa w ciągu następnych 7 dni
    const accounts = await prisma.connectedAccount.findMany({
      where: {
        provider: "INSTAGRAM",
        expiresAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dni
        },
      },
    });

    const results = await Promise.all(
      accounts.map(async (account) => {
        try {
          const newToken = await refreshInstagramToken(account.accessToken);
          if (newToken) {
            await prisma.connectedAccount.update({
              where: { id: account.id },
              data: {
                accessToken: newToken,
                expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 dni
              },
            });
            return { id: account.id, status: "success" };
          }
          return { id: account.id, status: "failed" };
        } catch (error) {
          console.error(
            `Błąd podczas odświeżania tokenu dla konta ${account.id}:`,
            error
          );
          return { id: account.id, status: "error", error };
        }
      })
    );

    return NextResponse.json({
      message: "Tokeny zostały odświeżone",
      results,
    });
  } catch (error) {
    console.error("Błąd podczas odświeżania tokenów:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas odświeżania tokenów" },
      { status: 500 }
    );
  }
}
