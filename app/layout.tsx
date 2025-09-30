import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils/utils";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "Social Flow",
  description:
    "Social Flow to platforma do automatyzacji publikowania postów na social media",
  keywords: [
    "social media",
    "automatyzacja",
    "publikowanie postów",
    "media społecznościowe",
    "planowanie postów",
    "social-flow",
    "marketing",
    "zarządzanie social media",
    "automatyzacja marketingu",
  ],
  authors: [{ name: "Social Flow", url: "https://social-flow.pl" }],
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    noimageindex: true,
    noarchive: true,
    nosnippet: true,
  },
  openGraph: {
    title: "Social Flow",
    description:
      "Social Flow to platforma do automatyzacji publikowania postów na social media",
    url: "https://social-flow.pl",
    siteName: "Social Flow",
    locale: "pl_PL",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const path = headersList.get("x-invoke-path") || "";
  const canonicalUrl = `https://www.social-flow.pl${path}`;
  return (
    <html lang="pl" className="h-full">
      <head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <title>Social Flow</title>
      </head>
      <body
        className={cn(
          "h-full min-h-screen relative overflow-x-hidden",
          poppins.className,
        )}
      >
        {/* Continuous gradient background */}
        <div className="fixed inset-0 z-0">
          {/* Vertical gradient base (light and dark) */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
          {/* Decorative blurred "blobs" */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-500/25 via-fuchsia-400/20 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-indigo-400/25 via-sky-400/20 to-transparent blur-3xl" />
        </div>

        <Providers>
          <div className="relative z-10 h-full">
            {children}
            <SpeedInsights />
          </div>
          <Toaster position="bottom-left" />
        </Providers>
      </body>
    </html>
  );
}
