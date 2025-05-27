"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaFacebook } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTab } from "@/context/TabContext";

function FacebookCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActiveTab } = useTab();

  const navigateToDashboard = () => {
    setActiveTab("accounts");
    router.push("/dashboard/");
  };

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      handleOAuthError(error, errorDescription);
      return;
    }

    if (code && state) {
      handleFacebookCallback(code, state);
    } else {
      handleMissingParams();
    }
  }, [searchParams]);

  const handleOAuthError = (error: string, description?: string | null) => {
    let errorMessage = "Nie udało się połączyć konta Facebook";
    let errorDescription =
      "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";

    switch (error) {
      case "access_denied":
        errorMessage = "Odmowa dostępu";
        errorDescription = "Nie wyraziłeś zgody na połączenie konta Facebook.";
        break;
      case "invalid_scope":
        errorMessage = "Nieprawidłowe uprawnienia";
        errorDescription =
          "Wymagane uprawnienia nie zostały poprawnie skonfigurowane.";
        break;
      case "invalid_request":
        errorMessage = "Nieprawidłowe żądanie";
        errorDescription = description || "Wystąpił błąd podczas autoryzacji.";
        break;
    }

    toast.error(errorMessage, {
      description: errorDescription,
      duration: 7000,
    });

    setTimeout(() => {
      navigateToDashboard();
    }, 3000);
  };

  const handleMissingParams = () => {
    toast.error("Brak wymaganych parametrów", {
      description:
        "Nie otrzymano wszystkich wymaganych danych do połączenia konta.",
      duration: 7000,
    });

    setTimeout(() => {
      navigateToDashboard();
    }, 3000);
  };

  const handleFacebookCallback = async (code: string, state: string) => {
    try {
      const response = await fetch("/api/auth/facebook/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Nie jesteś zalogowany");
        } else if (response.status === 400) {
          if (data.error === "Brak stron Facebook") {
            throw new Error("Brak stron Facebook");
          } else if (data.error === "Brak kodu autoryzacji") {
            throw new Error("Brak kodu autoryzacji");
          } else if (
            data.error === "Nie udało się pobrać listy stron Facebook"
          ) {
            throw new Error("Problem z dostępem do stron Facebook");
          }
        } else if (response.status === 500) {
          if (data.error === "Błąd konfiguracji") {
            throw new Error("Błąd konfiguracji systemu");
          } else if (
            data.error === "Nie udało się zapisać danych konta Facebook"
          ) {
            throw new Error("Problem z zapisem danych konta");
          }
        }
        throw new Error(
          data.error || "Wystąpił błąd podczas łączenia z kontem Facebook"
        );
      }

      if (data.success) {
        toast.success("Konto Facebook zostało pomyślnie połączone!", {
          description: `Połączono konto: ${data.account.name}`,
          duration: 5000,
        });
        navigateToDashboard();
      } else {
        throw new Error(data.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd podczas łączenia z Facebookiem:", error);

      let errorMessage = "Nie udało się połączyć konta Facebook";
      let errorDescription =
        "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();

        switch (errorText) {
          case "nie jesteś zalogowany":
            errorMessage = "Brak zalogowania";
            errorDescription =
              "Musisz być zalogowany, aby połączyć konto Facebook.";
            break;
          case "brak stron facebook":
            errorMessage = "Brak stron Facebook";
            errorDescription =
              "Nie znaleziono żadnych stron Facebook powiązanych z Twoim kontem. Utwórz stronę na Facebooku przed połączeniem konta.";
            break;
          case "brak kodu autoryzacji":
            errorMessage = "Brak kodu autoryzacji";
            errorDescription =
              "Nie otrzymano kodu autoryzacji z Facebook. Spróbuj ponownie.";
            break;
          case "problem z dostępem do stron facebook":
            errorMessage = "Problem z dostępem do stron";
            errorDescription =
              "Upewnij się, że masz utworzoną stronę na Facebooku i masz do niej dostęp.";
            break;
          case "błąd konfiguracji systemu":
            errorMessage = "Błąd konfiguracji";
            errorDescription =
              "Wystąpił problem z konfiguracją systemu. Skontaktuj się z pomocą techniczną.";
            break;
          case "problem z zapisem danych konta":
            errorMessage = "Problem z zapisem danych";
            errorDescription =
              "Nie udało się zapisać danych Twojego konta Facebook. Spróbuj ponownie później.";
            break;
          case "nieprawidłowy state":
            errorMessage = "Błąd weryfikacji";
            errorDescription =
              "Weryfikacja bezpieczeństwa nie powiodła się. Spróbuj ponownie.";
            break;
          default:
            if (
              errorText.includes("uprawnień") ||
              errorText.includes("scope")
            ) {
              errorMessage = "Brak wymaganych uprawnień";
              errorDescription =
                "Upewnij się, że wyraziłeś zgodę na wszystkie wymagane uprawnienia podczas łączenia konta.";
            } else if (
              errorText.includes("sesja") ||
              errorText.includes("wygasła")
            ) {
              errorMessage = "Sesja wygasła";
              errorDescription = "Spróbuj ponownie połączyć konto Facebook.";
            }
        }
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 7000,
      });

      setTimeout(() => {
        navigateToDashboard();
      }, 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1">
          <div className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-gradient" />
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-75 blur animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-xl">
                <FaFacebook className="h-12 w-12 text-blue-600" />
              </div>
            </div>

            <div className="text-center space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Łączenie konta Facebook
                </h1>
                <p className="text-base text-gray-700">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-blue-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium text-base">Przetwarzanie...</span>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-start gap-4 text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p>Weryfikacja uprawnień i poświadczeń</p>
                </div>
                <div className="flex items-start gap-4 text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p>Konfiguracja dostępu do publikowania treści</p>
                </div>
                <div className="flex items-start gap-4 text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p>Przygotowanie integracji z Social Flow</p>
                </div>
              </div>

              <div className="text-sm text-gray-600 mt-6">
                <p>Proces może potrwać kilka sekund...</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function FacebookCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <FacebookCallbackContent />
    </Suspense>
  );
}
