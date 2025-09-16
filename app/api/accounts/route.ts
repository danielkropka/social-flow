import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const accounts = await db.connectedAccount.findMany({
      where: {
        userId: session.user.id,
      },
    });

    return new Response(JSON.stringify(accounts), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
