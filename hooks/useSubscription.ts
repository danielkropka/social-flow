import { PlanInterval, PlanType } from "@prisma/client";
import { useSession } from "next-auth/react";

export function useSubscription() {
  const { data: session, status } = useSession();
  const user = session?.user as any;

  return {
    isSubscribed:
      user?.subscriptionStatus === "ACTIVE" ||
      user?.subscriptionStatus === "TRIALING",
    type: user?.subscriptionType as PlanType,
    interval: user?.subscriptionInterval as PlanInterval,
    isLoading: status === "loading",
  };
}
