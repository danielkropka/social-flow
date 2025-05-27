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
import * as z from "zod";
import { EyeIcon } from "@/components/icons/Eye";
import { EyeOffIcon } from "@/components/icons/EyeOff";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result) {
        toast.error("Wystąpił nieoczekiwany błąd podczas logowania");
        return;
      }

      switch (result.error) {
        case "GoogleAccount":
          toast.error(
            "To konto zostało utworzone przez Google. Użyj przycisku 'Kontynuuj z Google' aby się zalogować."
          );
          break;
        case "EmailNotVerified":
          toast.error(
            "Twój email nie został jeszcze zweryfikowany. Sprawdź swoją skrzynkę pocztową i kliknij w link weryfikacyjny."
          );
          break;
        case "InvalidCredentials":
          toast.error("Nieprawidłowy email lub hasło");
          break;
        case "Email i hasło są wymagane":
          toast.error("Proszę wypełnić wszystkie pola");
          break;
        case "Nie znaleziono konta z podanym adresem email":
          toast.error("Nie znaleziono konta z podanym adresem email");
          break;
        default:
          if (result.error) {
            toast.error(`Wystąpił błąd: ${result.error}`);
          } else {
            toast.success("Zalogowano pomyślnie");
            router.push("/dashboard");
            router.refresh();
          }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      if (error instanceof Error) {
        toast.error(`Wystąpił błąd: ${error.message}`);
      } else {
        toast.error("Wystąpił nieoczekiwany błąd podczas logowania");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Google sign in error:", error);
      if (error instanceof Error) {
        toast.error(`Błąd logowania przez Google: ${error.message}`);
      } else {
        toast.error("Wystąpił błąd podczas logowania przez Google");
      }
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
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm font-display">
            Social Flow
          </h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800 tracking-tight">
            Witaj ponownie
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Zaloguj się do swojego konta
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-5">
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
                  placeholder="••••••••"
                  className={`mt-1 pr-10 transition-all duration-200 focus:shadow-lg focus:shadow-blue-100/60 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  disabled={isLoading}
                  autoComplete="current-password"
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

            <div className="flex items-center">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
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
                  Logowanie...
                </div>
              ) : (
                "Zaloguj się"
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
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center text-gray-700 transition-all duration-300 hover:shadow-lg rounded-xl focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
            disabled={isLoading}
          >
            <GoogleLogo />
            <span className="text-sm font-medium ml-3">
              {isLoading ? "Logowanie..." : "Kontynuuj z Google"}
            </span>
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Nie masz jeszcze konta?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Zarejestruj się
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
