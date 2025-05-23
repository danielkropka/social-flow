"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaInstagram } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

function InstagramCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      handleInstagramError(error);
      return;
    }

    if (code) {
      handleInstagramCallback(code);
    }
  }, [searchParams]);

  const handleInstagramError = (error: string) => {
    let errorMessage = "Nie udało się połączyć konta Instagram";
    let errorDetails =
      "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";

    switch (error) {
      case "access_denied":
        errorMessage = "Odmowa dostępu";
        errorDetails =
          "Nie wyraziłeś zgody na wymagane uprawnienia. Spróbuj ponownie i upewnij się, że akceptujesz wszystkie wymagane uprawnienia.";
        break;
      case "invalid_scope":
        errorMessage = "Nieprawidłowe uprawnienia";
        errorDetails =
          "Wystąpił problem z uprawnieniami. Spróbuj ponownie połączyć konto.";
        break;
      case "invalid_request":
        errorMessage = "Nieprawidłowe żądanie";
        errorDetails =
          "Wystąpił problem z żądaniem autoryzacji. Spróbuj ponownie.";
        break;
    }

    toast.error(errorMessage, {
      description: errorDetails,
      duration: 7000,
    });

    setTimeout(() => {
      router.push("/dashboard/");
    }, 3000);
  };

  const handleInstagramCallback = async (code: string) => {
    try {
      const response = await fetch("/api/auth/instagram/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Nie udało się połączyć konta Instagram";
        let errorDescription =
          "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";
        if (data.code) {
          switch (data.code) {
            case "NOT_LOGGED_IN":
              errorMessage = "Musisz być zalogowany";
              errorDescription = "Zaloguj się i spróbuj ponownie.";
              break;
            case "CONFIG_ERROR":
              errorMessage = "Błąd konfiguracji aplikacji";
              errorDescription = "Skontaktuj się z pomocą techniczną.";
              break;
            case "MISSING_CODE":
              errorMessage = "Brak kodu autoryzacji";
              errorDescription = "Spróbuj ponownie połączyć konto Instagram.";
              break;
            case "INSTAGRAM_API_ERROR":
              errorMessage = "Błąd połączenia z Instagram";
              errorDescription =
                "Wystąpił problem z połączeniem z Instagram. Spróbuj ponownie.";
              break;
            case "INVALID_ACCOUNT_TYPE":
              errorMessage = "Nieprawidłowy typ konta";
              errorDescription =
                "Twoje konto Instagram musi być kontem firmowym lub twórcy. Przekonwertuj swoje konto na konto firmowe w ustawieniach Instagram.";
              break;
            case "ACCOUNT_NOT_FOUND":
              errorMessage = "Konto Instagram nie istnieje w systemie";
              errorDescription =
                "Spróbuj ponownie lub skontaktuj się z pomocą techniczną.";
              break;
            case "DB_ERROR":
              errorMessage = "Błąd serwera";
              errorDescription =
                "Wystąpił błąd po stronie serwera. Spróbuj ponownie później.";
              break;
            case "UNKNOWN_ERROR":
            default:
              errorMessage = "Nieoczekiwany błąd";
              errorDescription =
                "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";
              break;
          }
        }
        toast.error(errorMessage, {
          description: errorDescription,
          duration: 7000,
        });
        setTimeout(() => {
          router.push("/dashboard/");
        }, 3000);
        return;
      }

      if (data.success) {
        toast.success("Konto Instagram zostało pomyślnie połączone!", {
          description: `Połączono konto: ${data.account.name}`,
          duration: 5000,
        });
        router.push("/dashboard/");
      } else {
        toast.error("Nieznany błąd", {
          description:
            "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
          duration: 7000,
        });
        setTimeout(() => {
          router.push("/dashboard/");
        }, 3000);
      }
    } catch (error) {
      console.error("Błąd podczas łączenia z Instagram:", error);
      toast.error("Nie udało się połączyć konta Instagram", {
        description:
          "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
        duration: 7000,
      });
      setTimeout(() => {
        router.push("/dashboard/");
      }, 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1">
          <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient" />
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-xl">
                <FaInstagram className="h-12 w-12 text-pink-500" />
              </div>
            </div>

            <div className="text-center space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
                  Łączenie konta Instagram
                </h1>
                <p className="text-gray-500">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-gray-800">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Przetwarzanie...</span>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5" />
                  <p>Weryfikacja uprawnień i poświadczeń</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5" />
                  <p>Konfiguracja dostępu do publikowania treści</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5" />
                  <p>Przygotowanie integracji z Social Flow</p>
                </div>
              </div>

              <div className="text-xs text-gray-400 mt-6">
                <p>Proces może potrwać kilka sekund...</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function InstagramCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <InstagramCallbackContent />
    </Suspense>
  );
}
