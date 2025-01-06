import { db } from "@/lib/prisma";
import { PlanInterval, PlanStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

      try {
        await db.user.update({
          where: { email: customerEmail },
          data: {
            stripeCustomerId: customerId,
          },
        });

        console.log(`User with email ${customerEmail} processed successfully.`);
      } catch (error) {
        console.error("Error processing user:", error);
      }

      break;

    case "invoice.payment_succeeded":
      const invoice = event.data.object as Stripe.Invoice;
      customerId = invoice.customer as string;
      const subscription = invoice.subscription as string;

      try {
        // Pobierz dane subskrypcji z Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription
        );
        const planItem = stripeSubscription.items.data[0];

        // Zaktualizuj dane użytkownika w bazie danych
        await db.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus:
              stripeSubscription.status.toUpperCase() as PlanStatus,
            subscriptionType:
              planItem.plan.product === "prod_RMUAeeAnYcfXEI"
                ? "CREATOR"
                : "BASIC",
            subscriptionInterval:
              planItem.plan.interval.toUpperCase() as PlanInterval,
            subscriptionStart: new Date(stripeSubscription.start_date * 1000),
            subscriptionEnd: new Date(
              stripeSubscription.current_period_end * 1000
            ),
          },
        });

        console.log(
          `Subscription for customer ID ${customerId} updated successfully.`
        );
      } catch (error) {
        console.error("Error updating subscription:", error);
      }
      break;

    case "customer.subscription.updated":
      const updatedSubscription = event.data.object as Stripe.Subscription;
      customerId = updatedSubscription.customer as string;

      try {
        await updateSubscription(
          updatedSubscription.id,
          updatedSubscription.items.data[0].price.id
        );

        await db.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionType:
              updatedSubscription.items.data[0].plan.product ===
              "prod_RMUAeeAnYcfXEI"
                ? "CREATOR"
                : "BASIC",
            subscriptionInterval:
              updatedSubscription.items.data[0].plan.interval.toUpperCase() as PlanInterval,
            subscriptionStart: new Date(updatedSubscription.start_date * 1000),
            subscriptionEnd: new Date(
              updatedSubscription.current_period_end * 1000
            ),
          },
        });
      } catch (error) {
        console.error("Error updating subscription:", error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function updateSubscription(subscriptionId: string, newPriceId: string) {
  try {
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionId,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}
