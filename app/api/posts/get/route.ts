import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Provider } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const platform = searchParams.get("platform") as Provider | null;

  const posts = await db.post.findMany({
    where: {
      published: true,
      ...(dateFrom &&
        dateTo && {
          publishedAt: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
        }),
      ...(platform && {
        postConnectedAccounts: {
          some: {
            connectedAccount: {
              provider: platform,
            },
          },
        },
      }),
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      media: true,
      postConnectedAccounts: {
        include: {
          connectedAccount: true,
        },
      },
    },
  });

  return NextResponse.json(posts);
}
