import { Suspense } from "react";
import InstagramCallbackContent from "./InstagramCallbackContent";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

export const metadata = {
  title: "Łączenie konta Instagram | Social Flow",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InstagramCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-pink-50/50 px-4 py-12">
          <Card className="w-full max-w-md relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1.5">
              <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient" />
            </div>
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="mb-4 relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-75 blur-lg animate-pulse" />
                <div className="relative bg-white rounded-full p-5 shadow-xl">
                  <FaInstagram className="h-14 w-14 text-pink-500" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Łączenie konta Instagram
                </h1>
                <p className="text-base text-gray-700">
                  Trwa proces autoryzacji i konfiguracji Twojego konta
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-pink-500 bg-pink-50/50 px-6 py-3 rounded-full">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium text-base">Przetwarzanie...</span>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <InstagramCallbackContent />
    </Suspense>
  );
}
