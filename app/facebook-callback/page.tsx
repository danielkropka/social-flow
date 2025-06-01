import { Suspense } from "react";
import FacebookCallbackContent from "./FacebookCallbackContent";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FaFacebook } from "react-icons/fa";

export const metadata = {
  title: "Łączenie konta Facebook | Social Flow",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FacebookCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50/50 px-4 py-12">
          <Card className="w-full max-w-md relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1.5">
              <div className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-gradient" />
            </div>
            <CardContent className="flex flex-col items-center gap-6 py-12">
              <div className="mb-4 relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-75 blur-lg animate-pulse" />
                <div className="relative bg-white rounded-full p-5 shadow-xl">
                  <FaFacebook className="h-14 w-14 text-blue-500" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Łączenie konta Facebook
                </h1>
                <p className="text-base text-gray-700">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-blue-500 bg-blue-50/50 px-6 py-3 rounded-full">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium text-base">Przetwarzanie...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <FacebookCallbackContent />
    </Suspense>
  );
}
