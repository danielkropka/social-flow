"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      toast.error("Wypełnij oba pola hasła");
      return;
    }
    if (password.length < 8) {
      toast.error("Hasło musi mieć minimum 8 znaków");
      return;
    }
    if (password !== confirm) {
      toast.error("Hasła muszą być identyczne");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, uid, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd serwera");
      setIsSuccess(true);
      toast.success(data.message);
      setTimeout(() => router.push("/sign-in"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Wystąpił błąd podczas resetowania hasła");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center">
          <p className="text-red-600 font-semibold mb-4">
            Nieprawidłowy link resetujący.
          </p>
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Wygeneruj nowy link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>
      <div className="animate-fade-in-up max-w-[28rem] w-full bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl flex flex-col gap-8 relative z-10 m-4 border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm font-display">
            Ustaw nowe hasło
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Wprowadź nowe hasło do swojego konta.
          </p>
        </div>
        {isSuccess ? (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-4">
              Hasło zostało zresetowane! Przekierowuję do logowania...
            </p>
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Powrót do logowania
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Nowe hasło
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Powtórz hasło
              </label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
              disabled={isLoading}
            >
              {isLoading ? "Resetuję..." : "Ustaw nowe hasło"}
            </Button>
            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Powrót do logowania
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
