"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaTwitter } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

function TwitterCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauth_token = searchParams.get("oauth_token");
    const oauth_verifier = searchParams.get("oauth_verifier");
    const tokenSecret = localStorage.getItem("twitter_token_secret");

    if (!oauth_token || !oauth_verifier || !tokenSecret) {
      toast.error("Brak wymaganych danych autoryzacji", {
        description: "Nie otrzymano wszystkich wymaganych danych z Twitter",
      });
      router.push("/dashboard/");
      return;
    }

    handleTwitterCallback(oauth_token, oauth_verifier, tokenSecret);
  }, [searchParams]);

  const handleTwitterCallback = async (
    oauth_token: string,
    oauth_verifier: string,
    tokenSecret: string
  ) => {
    try {
      const response = await fetch("/api/auth/twitter/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: oauth_token,
          verifier: oauth_verifier,
          tokenSecret: tokenSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Błąd podczas autoryzacji"
        );
      }

      if (data.success) {
        // Usuń token secret z localStorage
        localStorage.removeItem("twitter_token_secret");

        toast.success("Konto Twitter zostało pomyślnie połączone!", {
          description: `Połączono konto: ${data.account.name} (@${data.account.username})`,
          duration: 5000,
        });

        setTimeout(() => {
          router.push("/dashboard/");
        }, 3000);
      } else {
        throw new Error(data.details || data.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd podczas łączenia z Twitterem:", error);

      // Usuń token secret z localStorage w przypadku błędu
      localStorage.removeItem("twitter_token_secret");

      toast.error("Nie udało się połączyć konta Twitter", {
        description:
          error instanceof Error
            ? error.message
            : "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
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
          <div className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-gradient" />
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-75 blur animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-xl">
                <FaTwitter className="h-12 w-12 text-blue-400" />
              </div>
            </div>

            <div className="text-center space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text">
                  Łączenie konta Twitter
                </h1>
                <p className="text-gray-500">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-blue-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Przetwarzanie...</span>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p>Weryfikacja uprawnień i poświadczeń</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p>Konfiguracja dostępu do publikowania treści</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
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

export default function TwitterCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <TwitterCallbackContent />
    </Suspense>
  );
}
