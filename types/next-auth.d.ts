import NextAuth, { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    plan: string;
    planStatus: string;
    planInterval: string;
    planActiveUntil: Date;
  }

  interface Session {
    user: User;
  }
}
