import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { EyeIcon } from "@/components/icons/Eye";

export const metadata = {
  title: "Weryfikacja adresu e-mail | Social Flow",
  description:
    "Zweryfikuj swój adres e-mail, aby korzystać z Social Flow. Kliknij w link weryfikacyjny przesłany na Twój adres e-mail.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Weryfikacja adresu e-mail | Social Flow",
    description: "Zweryfikuj swój adres e-mail, aby korzystać z Social Flow.",
    url: "https://social-flow.pl/verify-email",
    siteName: "Social Flow",
    type: "website",
  },
};

function getSearchParams(searchParams: string): {
  token: string | null;
  uid: string | null;
} {
  const params = new URLSearchParams(searchParams);
  return {
    token: params.get("token"),
    uid: params.get("uid"),
  };
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: string;
}) {
  // Pobieram token i uid z searchParams (Next.js przekazuje je do propsów strony serwerowej)
  const { token, uid } = getSearchParams(searchParams);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-12">
          <Card className="w-full max-w-md relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1.5">
              <div className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-400 animate-gradient" />
            </div>
            <CardContent className="flex flex-col items-center gap-6 py-12">
              <div className="mb-4 relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 opacity-75 blur-lg animate-pulse" />
                <div className="relative bg-white rounded-full p-5 shadow-xl">
                  <EyeIcon className="h-14 w-14 text-green-500" />
                </div>
              </div>
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Weryfikacja adresu e-mail
                </h1>
                <p className="text-base text-gray-700">
                  Trwa weryfikacja Twojego adresu e-mail. Prosimy o chwilę
                  cierpliwości.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-green-500 bg-green-50/50 px-6 py-3 rounded-full">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium text-base">Przetwarzanie...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent token={token} uid={uid} />
    </Suspense>
  );
}
