import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const fileName = req.headers.get("X-File-Name") || `${Date.now()}-file`;
    const contentType =
      req.headers.get("X-File-Type") || "application/octet-stream";

    const buffer = Buffer.from(await req.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Błąd podczas uploadu do S3:", error);
    return NextResponse.json(
      { error: "Błąd podczas uploadu do S3" },
      { status: 500 }
    );
  }
}
