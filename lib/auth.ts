import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./prisma";
import { compare } from "bcryptjs";
import { PlanInterval } from "@prisma/client";
import { PlanType } from "@prisma/client";
import { PlanStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          subscriptionType: user.subscriptionType,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionStart: user.subscriptionStart || new Date(),
          subscriptionEnd: user.subscriptionEnd || new Date(),
          subscriptionInterval: user.subscriptionInterval,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.subscriptionType = user.subscriptionType;
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionStart = user.subscriptionStart;
        token.subscriptionEnd = user.subscriptionEnd;
        token.subscriptionInterval = user.subscriptionInterval;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image as string;
        session.user.subscriptionType = token.subscriptionType as PlanType;
        session.user.subscriptionStatus =
          token.subscriptionStatus as PlanStatus;
        session.user.subscriptionStart = token.subscriptionStart as Date;
        session.user.subscriptionEnd = token.subscriptionEnd as Date;
        session.user.subscriptionInterval =
          token.subscriptionInterval as PlanInterval;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};
