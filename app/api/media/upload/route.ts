import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { withMiddlewareRateLimit } from "@/middleware/rateLimit";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  return withMiddlewareRateLimit(async (req: NextRequest) => {
    try {
      const fileName = req.headers.get("X-File-Name") || `${Date.now()}-file`;
      const contentType =
        req.headers.get("X-File-Type") || "application/octet-stream";
      const blobUrl = req.headers.get("X-Blob-Url");

      let buffer: Buffer;
      if (blobUrl) {
        // Dla URL-i blob, pobieramy dane z URL-a
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error("Nie udało się pobrać pliku z URL blob");
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        // Dla zwykłych plików, używamy danych z requestu
        buffer = Buffer.from(await req.arrayBuffer());
      }

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
  })(req);
}
