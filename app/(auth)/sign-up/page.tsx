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
import { EyeIcon } from "@/components/icons/Eye";
import { EyeOffIcon } from "@/components/icons/EyeOff";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/credentials", {
        method: "POST",
        body: JSON.stringify({ data, action: "register" }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (
          result.error === "ValidationError" &&
          Array.isArray(result.details)
        ) {
          const fieldErrors: Record<string, string> = {
            firstName: "Imię jest wymagane",
            lastName: "Nazwisko jest wymagane",
            email: "Email jest wymagany",
            password: "Hasło jest wymagane",
            confirmPassword: "Potwierdzenie hasła jest wymagane",
            terms: "Musisz zaakceptować regulamin",
          };

          // Ustawiamy błędy dla każdego pola
          Object.entries(fieldErrors).forEach(([field, message]) => {
            setError(field as keyof RegisterFormValues, {
              type: "manual",
              message,
            });
          });
          return;
        } else if (result.error === "UserAlreadyExists") {
          setError("email", {
            type: "manual",
            message: "Użytkownik o podanym adresie e-mail już istnieje",
          });
          return;
        }

        toast.error("Wystąpił błąd podczas rejestracji", {
          description: result.message,
        });
        return;
      }

      if (result.success) {
        toast.success("Rejestracja przebiegła pomyślnie", {
          description: "Sprawdź swoją skrzynkę pocztową, aby aktywować konto",
        });
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      toast.error("Wystąpił błąd podczas rejestracji", {
        description: error instanceof Error ? error.message : "Nieznany błąd",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Error signing up with Google:", error);
      toast.error("Wystąpił błąd podczas rejestracji z Google", {
        description: error instanceof Error ? error.message : "Nieznany błąd",
      });
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
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm font-display">
            Social Flow
          </h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800 tracking-tight">
            Stwórz konto
          </h2>
          <p className="mt-2 text-base text-gray-600">
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
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-shake">
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                      />
                    </svg>
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
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-shake">
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                      />
                    </svg>
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
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-shake">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                    />
                  </svg>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Min. 8 znaków"
                  className={`mt-1 pr-10 transition-all duration-200 focus:shadow-lg focus:shadow-blue-100/60 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-shake">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                    />
                  </svg>
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
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className={`mt-1 pr-10 transition-all duration-200 focus:shadow-lg focus:shadow-blue-100/60 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"
                  }
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-shake">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                    />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${errors.terms ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"}
                transition-all cursor-pointer select-none
                hover:shadow-md hover:bg-gray-100
                focus-within:ring-2 focus-within:ring-blue-400
              `}
              tabIndex={0}
            >
              <input
                type="checkbox"
                {...register("terms")}
                className={`
                  accent-blue-600 w-5 h-5 rounded
                  border-2 border-gray-300
                  focus:ring-2 focus:ring-blue-400
                  transition-all
                `}
                disabled={isLoading}
                id="terms"
              />
              <span className="text-sm text-gray-700">
                Akceptuję{" "}
                <Link
                  href="/terms-of-service"
                  className="underline text-blue-600 hover:text-blue-800"
                  target="_blank"
                >
                  regulamin
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-shake">
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                  />
                </svg>
                {errors.terms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold relative overflow-hidden group transition-all duration-300 hover:shadow-xl rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
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
            className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center text-gray-700 transition-all duration-300 hover:shadow-lg rounded-xl focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
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
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
