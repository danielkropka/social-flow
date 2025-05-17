import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      subscriptionType?: string | null;
      subscriptionStatus?: string | null;
      subscriptionStart?: Date | null;
      subscriptionEnd?: Date | null;
      subscriptionInterval?: string | null;
    };
  }
}
