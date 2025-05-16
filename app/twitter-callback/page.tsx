"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaTwitter } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTab } from "@/context/TabContext";

function TwitterCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActiveTab } = useTab();

  const navigateToDashboard = () => {
    setActiveTab("accounts");
    router.push("/dashboard/");
  };

  useEffect(() => {
    const code = searchParams.get("code");
    const code_verifier = searchParams.get("code_verifier");

    if (!code || !code_verifier) {
      toast.error("Brak wymaganych danych autoryzacji", {
        description: "Nie otrzymano wszystkich wymaganych danych z Twitter",
      });
      navigateToDashboard();
      return;
    }

    handleTwitterCallback(code, code_verifier);
  }, [searchParams]);

  const handleTwitterCallback = async (code: string, code_verifier: string) => {
    try {
      const response = await fetch("/api/auth/twitter/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          code_verifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Błąd podczas autoryzacji"
        );
      }

      if (data.success) {
        toast.success("Konto Twitter zostało pomyślnie połączone!", {
          description: `Połączono konto: ${data.account.name} (@${data.account.username})`,
          duration: 5000,
        });

        setTimeout(() => {
          navigateToDashboard();
        }, 3000);
      } else {
        throw new Error(data.details || data.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd podczas łączenia z Twitterem:", error);

      toast.error("Nie udało się połączyć konta Twitter", {
        description:
          error instanceof Error
            ? error.message
            : "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
        duration: 7000,
      });

      setTimeout(() => {
        navigateToDashboard();
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-12">
      <Card className="w-full max-w-2xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1.5">
          <div className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-gradient" />
        </div>

        <div className="p-8 md:p-10">
          <div className="flex flex-col items-center">
            <div className="mb-10 relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-75 blur-lg animate-pulse" />
              <div className="relative bg-white rounded-full p-5 shadow-xl">
                <FaTwitter className="h-14 w-14 text-blue-400" />
              </div>
            </div>

            <div className="text-center space-y-8">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text">
                  Łączenie konta Twitter
                </h1>
                <p className="text-gray-600 text-lg">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-blue-500 bg-blue-50/50 px-6 py-3 rounded-full">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium text-lg">Przetwarzanie...</span>
              </div>

              <div className="space-y-5 pt-8 border-t border-gray-100">
                <div className="flex items-start gap-4 text-base text-gray-700 hover:text-blue-500 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 animate-pulse" />
                  <p>Weryfikacja uprawnień i poświadczeń</p>
                </div>
                <div className="flex items-start gap-4 text-base text-gray-700 hover:text-blue-500 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 animate-pulse" />
                  <p>Konfiguracja dostępu do publikowania treści</p>
                </div>
                <div className="flex items-start gap-4 text-base text-gray-700 hover:text-blue-500 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 animate-pulse" />
                  <p>Przygotowanie integracji z Social Flow</p>
                </div>
              </div>

              <div className="text-sm text-gray-500 mt-8 bg-gray-50/50 px-4 py-2 rounded-lg">
                <p>
                  Proces może potrwać kilka sekund. Prosimy o cierpliwość...
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TwitterCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-gray-600 font-medium">Ładowanie...</p>
          </div>
        </div>
      }
    >
      <TwitterCallbackContent />
    </Suspense>
  );
}
