import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={cn("bg-white relative", inter.className)}>
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
