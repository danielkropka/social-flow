import Stripe from "stripe";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";
import { PlanInterval } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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
      console.log("Session data:", session); // Debug log

      // Pobierz informacje o produkcie
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );
      console.log("Line items:", lineItems); // Debug log

      const priceId = lineItems.data[0].price?.id;
      console.log("Price ID:", priceId); // Debug log

      // Pobierz cenę i jej szczegóły
      const price = await stripe.prices.retrieve(priceId!);
      console.log("Price details:", price); // Debug log

      const planId = price.product as string;
      const interval = price.recurring?.interval || "month";

      // Aktualizuj użytkownika
      const updatedUser = await db.user.update({
        where: {
          email: session.customer_email!,
        },
        data: {
          stripeCustomerId: session.customer as string,
          plan: planId,
          planStatus: "ACTIVE",
          planInterval: interval.toUpperCase() as PlanInterval,
          planActiveUntil: new Date(session.expires_at * 1000),
        },
      });

      console.log("Updated user:", updatedUser); // Debug log
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 400,
    });
  }
}
