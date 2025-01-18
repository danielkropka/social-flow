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
      const customer = session.customer as Stripe.Customer;

      try {
        if (customer.email) {
          await db.user.update({
            where: { email: customer.email },
            data: {
              stripeCustomerId: customer.id,
              ...(session.metadata?.gotFreeTrial === "true" && {
                gotFreeTrial: true,
              }),
            },
          });

          console.log(
            `User with email ${customer.email} processed successfully.`
          );
        } else {
          console.log("User was not found");
        }
      } catch (error) {
        console.error("Error processing user:", error);
      }

      break;

    case "invoice.payment_succeeded":
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
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
            stripeSubscriptionId: stripeSubscription.id,
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
          `Subscription for customer ID ${customerId} created successfully.`
        );
      } catch (error) {
        console.error("Error creating subscription:", error);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
