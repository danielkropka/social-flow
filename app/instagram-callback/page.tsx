"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaInstagram } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTab } from "@/context/TabContext";

function InstagramCallbackContent() {
  const router = useRouter();
  const { setActiveTab } = useTab();
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

    router.push("/dashboard/");
    setActiveTab("accounts");
  }, [searchParams]);

  const handleInstagramError = (error: string) => {
    let errorMessage = "Nie udało się połączyć konta Instagram";
    let errorDetails =
      "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";

    if (error === "access_denied") {
      errorMessage = "Odmowa dostępu";
      errorDetails =
        "Anulowano autoryzację podczas procesu łączenia konta Instagram.";
    }

    toast.error(errorMessage, {
      description: errorDetails,
      duration: 7000,
    });

    router.push("/dashboard/");
    setActiveTab("accounts");
  };

  const handleInstagramCallback = async (code: string) => {
    try {
      const response = await fetch(`/api/accounts/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, provider: "instagram" }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        let errorMessage =
          "Wystąpił błąd podczas łączenia konta Instagram. Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.";
        if (typeof data.error === "string") {
          errorMessage = data.error;
        }
        toast.error(errorMessage, {
          duration: 7000,
        });
        return;
      }

      if (data.success) {
        toast.success("Konto Instagram zostało pomyślnie połączone!", {
          description: `Połączono konto: ${data.account.name} (@${data.account.username})`,
          duration: 5000,
        });
      } else {
        toast.error("Nieznany błąd", {
          description:
            "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Błąd podczas łączenia z Instagram:", error);
      toast.error("Nie udało się połączyć konta Instagram", {
        description:
          "Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.",
        duration: 7000,
      });
    } finally {
      router.push("/dashboard/");
      setActiveTab("accounts");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <Card className="relative overflow-hidden shadow-2xl rounded-3xl border-0 bg-white/90 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1.5">
          <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient" />
        </div>
        <div className="p-10">
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-60 blur-lg animate-pulse" />
              <div className="relative bg-white rounded-full p-5 shadow-2xl border border-pink-100">
                <FaInstagram className="h-14 w-14 text-pink-500" />
              </div>
            </div>
            <div className="text-center space-y-7">
              <div>
                <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text drop-shadow-sm">
                  Łączenie konta Instagram
                </h1>
                <p className="text-gray-600 text-base font-medium">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-800">
                <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                <span className="font-semibold tracking-wide">
                  Przetwarzanie...
                </span>
              </div>
              <div className="space-y-4 pt-7 border-t border-gray-200">
                <div className="flex items-start gap-4 text-sm text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5" />
                  <p>Weryfikacja uprawnień i poświadczeń</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5" />
                  <p>Konfiguracja dostępu do publikowania treści</p>
                </div>
                <div className="flex items-start gap-4 text-sm text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5" />
                  <p>Przygotowanie integracji z Social Flow</p>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-7">
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
        <div className="flex items-center justify-center min-h-screen bg-white/80">
          <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        </div>
      }
    >
      <InstagramCallbackContent />
    </Suspense>
  );
}
