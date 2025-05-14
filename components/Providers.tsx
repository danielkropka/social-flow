"use client";

import { TabProvider } from "@/context/TabContext";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <TabProvider>{children}</TabProvider>
    </SessionProvider>
  );
}
