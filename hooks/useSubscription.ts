import { useSession } from "next-auth/react";

export function useSubscription() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return {
    isSubscribed: user?.subscriptionStatus === "active",
    plan: user?.subscriptionPlan,
    interval: user?.subscriptionInterval,
  };
}
