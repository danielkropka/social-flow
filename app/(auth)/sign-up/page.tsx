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

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "Imię musi mieć minimum 2 znaki"),
    lastName: z.string().min(2, "Nazwisko musi mieć minimum 2 znaki"),
    email: z.string().email("Nieprawidłowy adres email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine((val) => val === true, "Musisz zaakceptować regulamin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      console.log("Starting registration process");

      const requestBody = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      };

      console.log("Sending request with data:", {
        ...requestBody,
        password: "[HIDDEN]",
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log("Parsed response:", result);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid server response");
      }

      if (!result.success) {
        throw new Error(
          result.error || result.details || "Registration failed"
        );
      }

      console.log("Registration successful, attempting login");

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("Sign in result:", signInResult);

      if (signInResult?.error) {
        throw new Error("Failed to login after registration");
      }

      toast.success("Account created successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (error: Error | unknown) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error(error);
      toast.error("Wystąpił błąd podczas rejestracji przez Google");
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
            Stwórz konto
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Dołącz do Social Flow już dziś
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="text-sm sm:text-base font-medium text-gray-700"
                >
                  Imię
                </label>
                <Input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  placeholder="Jan"
                  className="mt-1"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="text-sm sm:text-base font-medium text-gray-700"
                >
                  Nazwisko
                </label>
                <Input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  placeholder="Kowalski"
                  className="mt-1"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

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
                placeholder="Min. 8 znaków"
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm sm:text-base font-medium text-gray-700"
              >
                Potwierdź hasło
              </label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="••••••••"
                className="mt-1"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                {...register("terms")}
                className="mt-1 rounded border-gray-300 text-blue-600"
              />
              <label
                htmlFor="terms"
                className="text-sm sm:text-base text-gray-600"
              >
                Akceptuję{" "}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-700"
                >
                  regulamin
                </Link>{" "}
                oraz{" "}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700"
                >
                  politykę prywatności
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600">{errors.terms.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-10 sm:h-12 text-base sm:text-lg relative overflow-hidden group"
            disabled={isLoading}
          >
            <span className="relative z-10">
              {isLoading ? "Tworzenie konta..." : "Zarejestruj się"}
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
            onClick={handleGoogleSignUp}
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
              Masz już konto?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Zaloguj się
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
