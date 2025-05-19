"use client";

import { TabProvider } from "@/context/TabContext";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/config/queryClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        <TabProvider>{children}</TabProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
