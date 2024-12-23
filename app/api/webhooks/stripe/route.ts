import Stripe from "stripe";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";
import { PlanInterval } from "@prisma/client";
import { NextResponse } from "next/server";

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
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription as string;

      if (!userId) {
        return new NextResponse("No user ID", { status: 400 });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const planId = subscription.items.data[0].plan.id;
      const interval =
        subscription.items.data[0].price.recurring?.interval || "month";

      const updatedUser = await db.user.update({
        where: {
          id: userId,
        },
        data: {
          stripeCustomerId: session.customer as string,
          plan: planId,
          planStatus: "ACTIVE",
          planInterval: interval.toUpperCase() as PlanInterval,
          planActiveUntil: new Date(subscription.current_period_end * 1000),
        },
      });

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Webhook handler failed" }),
      { status: 400 }
    );
  }
}
