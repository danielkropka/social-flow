"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
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
        remember: data.remember,
        redirect: false,
      });

      if (result?.error === "GoogleAccount") {
        toast.error(
          "To konto zostało utworzone przez Google. Użyj przycisku 'Kontynuuj z Google' aby się zalogować."
        );
      } else if (result?.error) {
        toast.error("Nieprawidłowy email lub hasło");
      } else {
        toast.success("Zalogowano pomyślnie");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error(error);
      toast.error("Wystąpił błąd podczas logowania przez Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "28rem",
          width: "100%",
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "1rem",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          position: "relative",
          zIndex: 10,
          margin: "1rem",
        }}
      >
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#5DADE2] to-[#1ABC9C] text-transparent bg-clip-text">
            Social Flow
          </h1>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
            Witaj ponownie
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Zaloguj się do swojego konta
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm sm:text-base font-medium text-gray-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="nazwa@example.com"
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm sm:text-base font-medium text-gray-700"
              >
                Hasło
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  {...register("remember")}
                  className="rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm sm:text-base text-gray-600"
                >
                  Zapamiętaj mnie
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm sm:text-base text-blue-600 hover:text-blue-500"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 sm:h-12 text-base sm:text-lg relative overflow-hidden group"
            disabled={isLoading}
          >
            <span className="relative z-10">
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#5DADE2] to-[#1ABC9C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm sm:text-base">
              <span className="px-2 bg-white text-gray-500">
                Lub kontynuuj z
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-10 sm:h-12 bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-700"
            disabled={isLoading}
          >
            <GoogleLogo />
            <span className="text-sm sm:text-base">Google</span>
          </Button>

          <motion.div
            style={{
              textAlign: "center",
            }}
          >
            <p className="text-sm sm:text-base text-gray-600">
              Nie masz jeszcze konta?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Zarejestruj się
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
