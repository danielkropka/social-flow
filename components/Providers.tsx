"use client";

import { TabProvider } from "@/context/TabContext";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/config/queryClient";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { SessionWarningModal } from "@/components/SessionWarningModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

function SessionManager({ children }: { children: React.ReactNode }) {
  const { showWarning, showExpired } = useSessionTimeout();

  return (
    <>
      {children}
      <SessionWarningModal isOpen={showWarning} />
      <SessionExpiredModal isOpen={showExpired} />
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        <TabProvider>
          <SessionManager>{children}</SessionManager>
        </TabProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
