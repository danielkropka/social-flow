"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaTiktok } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

function TikTokCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      handleTikTokCallback(code, state);
    } else {
      handleMissingParams();
    }
  }, [searchParams]);

  const handleOAuthError = (error: string, description?: string | null) => {
    let errorMessage = "Nie udało się połączyć konta TikTok";
    let errorDescription =
      "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";

    switch (error) {
      case "access_denied":
        errorMessage = "Odmowa dostępu";
        errorDescription = "Nie wyraziłeś zgody na połączenie konta TikTok.";
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
      action: {
        label: "Spróbuj ponownie",
        onClick: () => router.push("/dashboard/"),
      },
    });

    setTimeout(() => {
      router.push("/dashboard/");
    }, 3000);
  };

  const handleMissingParams = () => {
    toast.error("Brak wymaganych parametrów", {
      description:
        "Nie otrzymano wszystkich wymaganych danych do połączenia konta.",
      duration: 7000,
      action: {
        label: "Spróbuj ponownie",
        onClick: () => router.push("/dashboard/"),
      },
    });

    setTimeout(() => {
      router.push("/dashboard/");
    }, 3000);
  };

  const handleTikTokCallback = async (code: string, state: string) => {
    try {
      const response = await fetch("/api/auth/tiktok/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Wystąpił błąd podczas łączenia z kontem TikTok"
        );
      }

      if (data.success) {
        toast.success("Konto TikTok zostało pomyślnie połączone!", {
          description: `Połączono konto: ${data.account.name}`,
          duration: 5000,
        });
        router.push("/dashboard/");
      } else {
        throw new Error(data.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd podczas łączenia z TikTok:", error);

      let errorMessage = "Nie udało się połączyć konta TikTok";
      let errorDescription =
        "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";

      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();

        if (errorText.includes("nie jesteś zalogowany")) {
          errorMessage = "Brak zalogowania";
          errorDescription =
            "Musisz być zalogowany, aby połączyć konto TikTok.";
        } else if (errorText.includes("nieprawidłowy state")) {
          errorMessage = "Błąd weryfikacji";
          errorDescription =
            "Weryfikacja bezpieczeństwa nie powiodła się. Spróbuj ponownie.";
        } else if (
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
          errorDescription = "Spróbuj ponownie połączyć konto TikTok.";
        } else if (errorText.includes("dane") || errorText.includes("pobrać")) {
          errorMessage = "Problem z danymi konta";
          errorDescription =
            "Nie udało się pobrać wszystkich wymaganych danych z Twojego konta TikTok.";
        } else if (errorText.includes("konfiguracji")) {
          errorMessage = "Błąd konfiguracji";
          errorDescription =
            "Wystąpił problem z konfiguracją systemu. Skontaktuj się z pomocą techniczną.";
        }
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 7000,
        action: {
          label: "Spróbuj ponownie",
          onClick: () => router.push("/dashboard/"),
        },
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
          <div className="h-full bg-gradient-to-r from-black via-gray-800 to-black animate-gradient" />
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-black to-gray-800 opacity-75 blur animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-xl">
                <FaTiktok className="h-12 w-12 text-black" />
              </div>
            </div>

            <div className="text-center space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-black to-gray-800 text-transparent bg-clip-text">
                  Łączenie konta TikTok
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
                  <div className="w-2 h-2 rounded-full bg-black mt-1.5" />
                  <p>Weryfikacja uprawnień i poświadczeń</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-black mt-1.5" />
                  <p>Konfiguracja dostępu do publikowania treści</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-black mt-1.5" />
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

export default function TikTokCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      }
    >
      <TikTokCallbackContent />
    </Suspense>
  );
}
