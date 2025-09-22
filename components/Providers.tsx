"use client";

import { TabProvider } from "@/context/TabContext";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/config/queryClient";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { SessionWarningModal } from "@/components/SessionWarningModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

function SessionManager({ children }: { children: React.ReactNode }) {
  const { showWarning, showExpired } = useSessionTimeout();
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" && pathname?.startsWith("/dashboard")) {
      router.replace("/sign-in");
    }
  }, [status, pathname, router]);

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
