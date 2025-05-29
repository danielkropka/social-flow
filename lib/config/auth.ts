import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/config/prisma";
import { User } from "next-auth";
import { PlanType, PlanStatus, PlanInterval } from "@prisma/client";
import { checkRateLimit } from "@/middleware/rateLimit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 dzień
    updateAge: 0,
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          // Sprawdź limit prób logowania
          const isAllowed = await checkRateLimit(
            `auth-rate-limit:${credentials?.email || "anonymous"}`,
            5,
            60 * 60 * 1000
          );
          if (!isAllowed) {
            throw new Error("TooManyAttempts");
          }

          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email i hasło są wymagane");
          }

          // Walidacja formatu email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email)) {
            throw new Error("InvalidEmailFormat");
          }

          // Walidacja długości hasła
          if (credentials.password.length < 8) {
            throw new Error("PasswordTooShort");
          }

          const user = await db.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              image: true,
              emailVerified: true,
              accounts: {
                select: {
                  provider: true,
                },
              },
            },
          });

          if (!user) {
            throw new Error("Nie znaleziono konta z podanym adresem email");
          }

          // const hasGoogleAccount = user.accounts.some(
          //   (account) => account.provider === "google"
          // );
          // if (hasGoogleAccount) {
          //   throw new Error("GoogleAccount");
          // }

          if (!user.emailVerified) {
            throw new Error("EmailNotVerified");
          }

          if (!user.password) {
            throw new Error(
              "Brak hasła. Zaloguj się przez Google lub ustaw hasło przez reset hasła."
            );
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error("InvalidCredentials");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          } as User;
        } catch (error) {
          console.error("Błąd autoryzacji:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      const dbUser = await db.user.findUnique({
        where: { id: token.id as string },
        select: {
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          subscriptionType: true,
          subscriptionStatus: true,
          subscriptionStart: true,
          subscriptionEnd: true,
          subscriptionInterval: true,
        },
      });

      if (dbUser) {
        token.stripeCustomerId = dbUser.stripeCustomerId;
        token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
        token.subscriptionType = dbUser.subscriptionType;
        token.subscriptionStatus = dbUser.subscriptionStatus;
        token.subscriptionStart = dbUser.subscriptionStart;
        token.subscriptionEnd = dbUser.subscriptionEnd;
        token.subscriptionInterval = dbUser.subscriptionInterval;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.stripeCustomerId = token.stripeCustomerId as string;
        session.user.stripeSubscriptionId =
          token.stripeSubscriptionId as string;
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
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};
