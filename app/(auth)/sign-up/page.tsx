"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      let result;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error("Pusta odpowiedź z serwera");
        }
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("Error parsing response:", error);
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }

      if (!response.ok) {
        if (
          result.error === "ValidationError" &&
          Array.isArray(result.details)
        ) {
          // Mapowanie błędów walidacji na odpowiednie pola formularza
          const fieldErrors: Record<string, string> = {
            firstName: "Imię jest wymagane",
            lastName: "Nazwisko jest wymagane",
            email: "Email jest wymagany",
            password: "Hasło jest wymagane",
            confirmPassword: "Potwierdzenie hasła jest wymagane",
          };

          // Ustawiamy błędy dla każdego pola
          Object.entries(fieldErrors).forEach(([field, message]) => {
            setError(field as keyof RegisterFormValues, {
              type: "manual",
              message,
            });
          });
          return;
        }

        if (result.error === "EmailExists") {
          setError("email", {
            type: "manual",
            message: "Ten adres email jest już zarejestrowany",
          });
          return;
        }

        if (result.error === "WeakPassword") {
          setError("password", {
            type: "manual",
            message: result.message || "Hasło jest zbyt słabe",
          });
          return;
        }

        throw new Error(result.message || "Wystąpił błąd podczas rejestracji");
      }

      // Rejestracja udana
      toast.success("Konto zostało utworzone! Sprawdź swoją skrzynkę email.");
      router.push("/sign-in");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas rejestracji"
      );
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Google sign up error:", error);
      toast.error("Wystąpił błąd podczas rejestracji przez Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="animate-fade-in-up max-w-[28rem] w-full bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl flex flex-col gap-8 relative z-10 m-4 border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text">
            Social Flow
          </h1>
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
            Stwórz konto
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            Dołącz do Social Flow już dziś
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700 block mb-2"
                >
                  Imię
                </label>
                <Input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  placeholder="Jan"
                  className={`mt-1 transition-all duration-200 ${
                    errors.firstName
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700 block mb-2"
                >
                  Nazwisko
                </label>
                <Input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  placeholder="Kowalski"
                  className={`mt-1 transition-all duration-200 ${
                    errors.lastName
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

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
                {...register("email")}
                placeholder="nazwa@example.com"
                className={`mt-1 transition-all duration-200 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "focus:ring-blue-500 focus:border-blue-500"
                }`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 animate-shake">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Hasło
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Min. 8 znaków"
                className={`mt-1 transition-all duration-200 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "focus:ring-blue-500 focus:border-blue-500"
                }`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 animate-shake">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 block mb-2"
              >
                Potwierdź hasło
              </label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="••••••••"
                className={`mt-1 transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "focus:ring-blue-500 focus:border-blue-500"
                }`}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 animate-shake">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium relative overflow-hidden group transition-all duration-300 hover:shadow-lg"
            disabled={isLoading}
          >
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Rejestracja...
                </div>
              ) : (
                "Zarejestruj się"
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Lub kontynuuj z
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center text-gray-700 transition-all duration-300 hover:shadow-md"
            disabled={isLoading}
          >
            <GoogleLogo />
            <span className="text-sm font-medium ml-3">
              {isLoading ? "Rejestracja..." : "Kontynuuj z Google"}
            </span>
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Masz już konto?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Zaloguj się
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
