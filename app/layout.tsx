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
  title: "Social-flow",
  description:
    "Social-flow to platforma do automatyzacji publikowania postów na social media",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    noimageindex: true,
    noarchive: true,
    nosnippet: true,
  },
  openGraph: {
    title: "Social-flow",
    description:
      "Social-flow to platforma do automatyzacji publikowania postów na social media",
    url: "https://social-flow.pl",
    siteName: "Social-flow",
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
