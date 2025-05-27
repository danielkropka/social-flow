"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "@/components/icons/Check";
import { EyeIcon } from "@/components/icons/Eye";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verify = async () => {
      if (!token || !uid) {
        setStatus("error");
        setMessage("Brak wymaganych danych do weryfikacji.");
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, uid }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(
            data.message ||
              "Email został zweryfikowany. Możesz się teraz zalogować."
          );
        } else {
          setStatus("error");
          setMessage(data.error || "Weryfikacja nie powiodła się.");
        }
      } catch (error: unknown) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Wystąpił błąd połączenia z serwerem."
        );
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md mx-auto animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Weryfikacja adresu e-mail
          </CardTitle>
          <CardDescription className="text-center">
            {status === "loading"
              ? "Trwa weryfikacja Twojego adresu e-mail. Prosimy o chwilę cierpliwości."
              : status === "success"
                ? "Twój adres e-mail został zweryfikowany. Możesz się teraz zalogować."
                : "Weryfikacja nie powiodła się. Sprawdź link lub spróbuj ponownie."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Alert>
                <AlertTitle>Weryfikacja trwa...</AlertTitle>
                <AlertDescription>
                  Sprawdzamy Twój link weryfikacyjny.
                </AlertDescription>
              </Alert>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <Alert>
                <Check className="w-6 h-6 text-green-500" />
                <AlertTitle className="text-green-700">Sukces!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <Alert variant="destructive">
                <EyeIcon className="w-6 h-6 text-red-500" />
                <AlertTitle className="text-red-700">
                  Błąd weryfikacji
                </AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <p className="text-xs text-gray-400 text-center">
                Jeśli problem się powtarza, skontaktuj się z pomocą techniczną
                lub spróbuj ponownie później.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {(status === "success" || status === "error") && (
            <Button asChild className="w-full">
              <Link href="/sign-in">Powrót do logowania</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
