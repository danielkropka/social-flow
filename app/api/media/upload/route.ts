import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { authOptions } from "@/lib/config/auth";
import { getServerSession } from "next-auth";
import { checkFileExtension } from "@/lib/utils/utils";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "250mb",
    },
  },
};

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "NoFile" }, { status: 400 });
      }

      if (!checkFileExtension(file))
        return NextResponse.json({ error: "InvalidFileType" }, { status: 400 });

      const fileName = file.name;
      const fileExtension = fileName.split(".").pop();
      const fileKey = `uploads/${session.user.id}/${fileName}.${fileExtension}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      });

      await s3.send(command);

      const url = `https://${process.env.AWS_S3_BUCKET_NAME!}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      return NextResponse.json({
        url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      {
        error: "InternalServerError",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
