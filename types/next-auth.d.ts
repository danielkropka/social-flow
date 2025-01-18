import NextAuth, { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    subscriptionType: PlanType;
    subscriptionStatus: PlanStatus;
    subscriptionStart: Date;
    subscriptionEnd: Date;
    subscriptionInterval: PlanInterval;
  }

  interface Session {
    user: User;
  }
}
