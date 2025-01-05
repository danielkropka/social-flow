import { db } from "@/lib/prisma";
import { PlanInterval, PlanStatus } from "@prisma/client";
import { PlanType } from "@prisma/client";
import { addMonths } from "date-fns";
import { addYears } from "date-fns";
import { useSession } from "next-auth/react";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const { update } = useSession();

  let event: Stripe.Event;
  let customerId: string;
  let customerEmail: string;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Webhook signature verification failed.", err);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    } else {
      console.error("An unknown error occurred.");
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 400 }
      );
    }
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      customerId = session.customer as string;
      customerEmail = session.customer_email as string;

      const subscriptionType = session.metadata?.subscriptionType || "BASIC";
      const subscriptionInterval =
        session.metadata?.subscriptionInterval || "MONTH";

      // Calculate subscription end date based on interval
      let subscriptionEnd: Date;
      if (subscriptionInterval.toLowerCase() === "year") {
        subscriptionEnd = addYears(new Date(), 1);
      } else {
        // Default to monthly if not specified
        subscriptionEnd = addMonths(new Date(), 1);
      }

      try {
        await db.user.update({
          where: { email: customerEmail },
          data: {
            stripeCustomerId: customerId,
            subscriptionStatus: "ACTIVE",
            subscriptionType: subscriptionType as PlanType,
            subscriptionInterval: subscriptionInterval as PlanInterval,
            subscriptionStart: new Date(),
            subscriptionEnd: subscriptionEnd,
          },
        });

        await update();
        console.log(`User with email ${customerEmail} processed successfully.`);
      } catch (error) {
        console.error("Error processing user:", error);
      }

      break;

    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription;
      customerId = subscription.customer as string;
      const planName = subscription.items.data[0].plan.product;

      try {
        await db.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: subscription.status.toUpperCase() as PlanStatus,
            subscriptionType:
              planName === "prod_RMUAeeAnYcfXEI"
                ? "CREATOR"
                : planName === "prod_RMU94PRJsMwxD4"
                ? "BASIC"
                : "FREE",
            subscriptionInterval:
              subscription.items.data[0].plan.interval.toUpperCase() as PlanInterval,
            subscriptionStart: new Date(subscription.start_date * 1000),
            subscriptionEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        await update();

        console.log(
          `Subscription for customer ID ${customerId} updated successfully.`
        );
      } catch (error) {
        console.error("Error updating subscription:", error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
