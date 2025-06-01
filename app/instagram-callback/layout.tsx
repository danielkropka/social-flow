import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Flow - Łączenie konta Instagram",
  description: "Łączenie konta Instagram z Social Flow",
  robots: {
    index: false,
    follow: false,
    noimageindex: true,
    noarchive: true,
    nosnippet: true,
  },
};

export default function InstagramCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
