import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils/utils";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="pl">
      <head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
      </head>
      <body className={cn("bg-white relative", inter.className)}>
        <Providers>
          {children}
          <SpeedInsights />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
