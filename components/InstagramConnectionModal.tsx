"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { SiInstagram } from "react-icons/si";

interface InstagramConnectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isSuccess?: boolean;
}

export default function InstagramConnectionModal({
  isOpen,
  onClose,
  isSuccess = false,
}: InstagramConnectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-busy={true}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border shadow-lg ${
                  isSuccess
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    : "bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200"
                }`}
              >
                <SiInstagram
                  className={`h-8 w-8 ${isSuccess ? "text-green-600" : "text-[#E4405F]"}`}
                />
              </div>
              <div className="absolute -top-1 -right-1">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    isSuccess ? "bg-green-500" : "bg-blue-500"
                  }`}
                >
                  {isSuccess ? (
                    <div className="h-3 w-3 rounded-full bg-white" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            {isSuccess
              ? "Połączenie z Instagram udane!"
              : "Łączenie z Instagram"}
          </DialogTitle>

          <DialogDescription className="text-center text-gray-600 mt-2">
            {isSuccess
              ? "Twoje konto Instagram zostało pomyślnie połączone. Możesz teraz publikować posty!"
              : "Przekierowujemy Cię do oficjalnej strony Instagram, aby autoryzować połączenie z Twoim kontem."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Progress Steps */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-gray-700">
                Inicjalizacja połączenia
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isSuccess ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                {isSuccess ? (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
              <span
                className={`text-sm ${isSuccess ? "text-gray-700" : "text-gray-700"}`}
              >
                {isSuccess
                  ? "Przekierowanie zakończone"
                  : "Przekierowanie do Instagram"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isSuccess ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    isSuccess ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>
              <span
                className={`text-sm ${isSuccess ? "text-gray-700" : "text-gray-500"}`}
              >
                {isSuccess ? "Autoryzacja zakończona" : "Autoryzacja konta"}
              </span>
            </div>
          </div>

          {/* Loading Animation */}
          {!isSuccess && (
            <div className="flex justify-center py-4">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-pink-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          {/* Success Animation */}
          {isSuccess && (
            <div className="flex justify-center py-4">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div
            className={`rounded-lg border p-4 ${
              isSuccess
                ? "bg-green-50/50 dark:bg-green-950/20"
                : "bg-blue-50/50 dark:bg-blue-950/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full mt-0.5 ${
                  isSuccess ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    isSuccess ? "bg-green-500" : "bg-blue-500"
                  }`}
                />
              </div>
              <div
                className={`text-sm ${
                  isSuccess
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}
              >
                <p className="font-medium mb-1">
                  {isSuccess
                    ? "Połączenie zakończone pomyślnie!"
                    : "Bezpieczne połączenie"}
                </p>
                <p className="text-xs">
                  {isSuccess
                    ? "Twoje konto Instagram jest teraz gotowe do publikowania postów i zarządzania treścią."
                    : "Instagram używa bezpiecznego protokołu OAuth 2.0. Twoje hasło nie jest nigdzie przechowywane."}
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {isSuccess ? (
                "Modal zostanie automatycznie zamknięty za chwilę."
              ) : (
                <>
                  Jeśli nie zostaniesz automatycznie przekierowany,{" "}
                  <button
                    onClick={onClose}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    kliknij tutaj
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
