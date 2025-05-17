import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getMinDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now.toISOString().slice(0, 16);
};

// Funkcja do szyfrowania tokenów
export function encryptToken(token: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || "default-key",
    "salt",
    32
  );
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Zwracamy IV i zaszyfrowany tekst jako jeden string
  return `${iv.toString("hex")}:${encrypted}`;
}

// Funkcja do deszyfrowania tokenów
export function decryptToken(encryptedToken: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || "default-key",
    "salt",
    32
  );

  // Rozdzielamy IV i zaszyfrowany tekst
  const [ivHex, encrypted] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
