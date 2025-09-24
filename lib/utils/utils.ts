import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0][0] || "U").toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const checkFileExtension = (file: File) => {
  const isImage = file.type.startsWith("image/");

  return isImage
    ? ACCEPTED_IMAGE_TYPES.includes(file.type)
    : ACCEPTED_VIDEO_TYPES.includes(file.type);
};

export const getFileType = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  return isImage ? "image" : isVideo ? "video" : "unknown";
};

export function encryptToken(token: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || "default-key",
    "salt",
    32,
  );
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || "default-key",
    "salt",
    32,
  );

  const [ivHex, encrypted] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
