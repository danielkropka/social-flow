import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { db } from "@/lib/config/prisma";
import { SafeAccount } from "@/types";

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

    // Return only safe account data without tokens or sensitive information
    const safeAccounts: SafeAccount[] = accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      status: account.status,
      connectedAt: account.connectedAt,
      revokedAt: account.revokedAt,
      lastSyncedAt: account.lastSyncedAt,
      lastPublishAt: account.lastPublishAt,
      username: account.username,
      displayName: account.displayName,
      profileImageUrl: account.profileImageUrl,
      profileUrl: account.profileUrl,
      locale: account.locale,
      timezone: account.timezone,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      deletedAt: account.deletedAt,
    }));

    return new Response(JSON.stringify(safeAccounts), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Account ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the account belongs to the current user
    const account = await db.connectedAccount.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the account
    await db.connectedAccount.delete({
      where: {
        id: id,
      },
    });

    // Also delete any scheduled posts for this account
    await db.post.deleteMany({
      where: {
        userId: id,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
