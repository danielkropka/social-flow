import { headers } from "next/headers";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { PlanInterval } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature")!;

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Pobierz metadane z sesji
      const { planId, interval } = session.metadata as {
        planId: string;
        interval: "monthly" | "yearly";
      };

      // Zaktualizuj plan użytkownika w bazie danych
      await db.user.update({
        where: {
          email: session.customer_email!,
        },
        data: {
          stripeCustomerId: session.customer as string,
          plan: planId,
          planInterval: interval.toUpperCase() as PlanInterval,
          planActiveUntil: new Date(session.expires_at * 1000),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
