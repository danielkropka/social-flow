import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import { Provider } from "@prisma/client";
import { handleTwitterConnect } from "./providers/twitter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as Provider | undefined;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!provider || !Object.values(Provider).includes(provider)) {
    return NextResponse.json({ error: "UnsupportedProvider" }, { status: 400 });
  }

  switch (provider) {
    case Provider.TWITTER:
      return handleTwitterConnect(session.user.id);
    default:
      return NextResponse.json(
        { error: "UnsupportedProvider" },
        { status: 400 },
      );
  }
}
