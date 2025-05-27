"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd serwera");
      setIsSent(true);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message || "Wystąpił błąd podczas wysyłania żądania");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>
      <div className="animate-fade-in-up max-w-[28rem] w-full bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl flex flex-col gap-8 relative z-10 m-4 border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm font-display">
            Przypomnij hasło
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Podaj swój adres email, a wyślemy Ci instrukcję resetowania hasła.
          </p>
        </div>
        {isSent ? (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-4">
              Jeśli podany email istnieje w naszej bazie, wysłaliśmy instrukcję
              resetowania hasła.
            </p>
            <Link
              href="/(auth)/sign-in"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Powrót do logowania
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nazwa@example.com"
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
              {isLoading ? "Wysyłanie..." : "Wyślij instrukcję"}
            </Button>
            <div className="text-center">
              <Link
                href="/(auth)/sign-in"
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
