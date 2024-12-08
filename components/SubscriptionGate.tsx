import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isSubscribed } = useSubscription();
  const router = useRouter();

  if (!isSubscribed) {
    router.push("/pricing");
    return null;
  }

  return <>{children}</>;
}
