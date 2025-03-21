import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { thumbnailUrl } = await request.json();

    if (!thumbnailUrl) {
      return new NextResponse("Brak miniaturki", { status: 400 });
    }

    const { id } = await request.json();

    const postId = id;
    if (!postId) {
      return new NextResponse("Brak ID posta", { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        media: true,
      },
    });

    if (!post) {
      return new NextResponse("Post nie znaleziony", { status: 404 });
    }

    // Aktualizuj miniaturkę dla pierwszego medium typu VIDEO
    const videoMedia = post.media.find((m) => m.type === "VIDEO");
    if (videoMedia) {
      const updatedPost = await db.post.update({
        where: { id: postId },
        data: {
          media: {
            update: {
              where: { id: videoMedia.id },
              data: { thumbnailUrl },
            },
          },
        },
        include: {
          media: true,
        },
      });
      return NextResponse.json({ success: true, post: updatedPost });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[THUMBNAIL_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
