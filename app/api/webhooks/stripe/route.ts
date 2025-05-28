import { db } from "@/lib/config/prisma";
import { PlanInterval, PlanStatus, PlanType } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_PRODUCTS = {
  CREATOR: process.env.STRIPE_CREATOR_PRODUCT_ID,
  BASIC: process.env.STRIPE_BASIC_PRODUCT_ID,
} as const;

const getSubscriptionType = (
  product: string | Stripe.Product | Stripe.DeletedProduct | null
): PlanType => {
  if (!product) return "FREE";

  const productId = typeof product === "string" ? product : product.id;

  switch (productId) {
    case STRIPE_PRODUCTS.CREATOR:
      return "CREATOR";
    case STRIPE_PRODUCTS.BASIC:
      return "BASIC";
    default:
      return "FREE";
  }
};

// Typ do aktualizacji użytkownika w bazie
type UserUpdateData = {
  stripeSubscriptionId: string | null;
  subscriptionStatus: PlanStatus | null;
  subscriptionType?: PlanType | null;
  subscriptionInterval?: PlanInterval | null;
  subscriptionStart?: Date | null;
  subscriptionEnd?: Date | null;
  gotFreeTrial?: boolean;
};

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
      const customer = session.customer as string;
      const customerEmail = session.customer_email as string;
      try {
        const user = await db.user.findUnique({
          where: { email: customerEmail },
        });

        if (!user) {
          throw new Error(`User with email ${customerEmail} not found`);
        }

        await db.user.update({
          where: { id: user.id },
          data: {
            stripeCustomerId: customer,
          },
        });

        console.log(
          `User ${customerEmail || customer} processed successfully.`
        );
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
        const stripeSubscription =
          await stripe.subscriptions.retrieve(subscription);
        const planItem = stripeSubscription.items.data[0];
        if (!planItem) {
          console.error(
            `Brak planItem w subskrypcji Stripe: ${stripeSubscription.id}`
          );
          return NextResponse.json(
            { error: "Brak planItem w subskrypcji Stripe" },
            { status: 500 }
          );
        }
        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) {
          console.error(
            `User with stripeCustomerId ${customerId} not found. Customer ID: ${customerId}, Subscription: ${subscription}`
          );
          throw new Error("User not found");
        }
        const status =
          PlanStatus[
            stripeSubscription.status.toUpperCase() as keyof typeof PlanStatus
          ] ?? null;
        if (!status) {
          console.warn(
            `Nieoczekiwany status subskrypcji: ${stripeSubscription.status} (ID: ${stripeSubscription.id})`
          );
        }
        let updateData: UserUpdateData = {
          stripeSubscriptionId: stripeSubscription.id,
          subscriptionStatus: status,
        };
        if (status === PlanStatus.ACTIVE || status === PlanStatus.TRIALING) {
          updateData = {
            ...updateData,
            subscriptionType: getSubscriptionType(planItem.plan.product),
            subscriptionInterval:
              PlanInterval[
                planItem.plan.interval.toUpperCase() as keyof typeof PlanInterval
              ] ?? null,
            subscriptionStart: new Date(stripeSubscription.start_date * 1000),
            subscriptionEnd: new Date(
              stripeSubscription.current_period_end * 1000
            ),
            gotFreeTrial: stripeSubscription.trial_start
              ? true
              : user.gotFreeTrial,
          };
        } else if (
          status === PlanStatus.PAST_DUE ||
          status === PlanStatus.INCOMPLETE ||
          status === PlanStatus.UNPAID ||
          status === PlanStatus.CANCELED ||
          status === PlanStatus.INCOMPLETE_EXPIRED
        ) {
          updateData = {
            ...updateData,
            subscriptionType: null,
            subscriptionInterval: null,
            subscriptionStart: null,
            subscriptionEnd: null,
          };
        } else {
          // fallback dla nieoczekiwanych statusów
          console.warn(
            `Brak obsługi dla statusu: ${status} (ID subskrypcji: ${stripeSubscription.id}, user: ${user.id}, email: ${user.email})`
          );
        }
        await db.user.update({
          where: { id: user.id },
          data: updateData,
        });

        console.log(
          `Subscription for user ${user.id} (${user.email}) created successfully. Status: ${status}, SubscriptionId: ${stripeSubscription.id}`
        );
      } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
          { error: "Failed to process subscription" },
          { status: 500 }
        );
      }
      break;

    case "customer.subscription.updated":
      const updatedSubscription = event.data.object as Stripe.Subscription;
      const updatedCustomerId = updatedSubscription.customer as string;

      try {
        const user = await db.user.findFirst({
          where: { stripeCustomerId: updatedCustomerId },
        });

        if (!user) {
          console.error(
            `User with stripeCustomerId ${updatedCustomerId} not found. Subscription: ${updatedSubscription.id}`
          );
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const planItem = updatedSubscription.items.data[0];
        if (!planItem) {
          console.error(
            `Brak planItem w subskrypcji Stripe: ${updatedSubscription.id}`
          );
          return NextResponse.json(
            { error: "Brak planItem w subskrypcji Stripe" },
            { status: 500 }
          );
        }
        // Jawne mapowanie statusu na enum Prisma
        const status =
          PlanStatus[
            updatedSubscription.status.toUpperCase() as keyof typeof PlanStatus
          ] ?? null;
        if (!status) {
          console.warn(
            `Nieoczekiwany status subskrypcji: ${updatedSubscription.status} (ID: ${updatedSubscription.id})`
          );
        }
        let updateData: UserUpdateData = {
          stripeSubscriptionId: updatedSubscription.id,
          subscriptionStatus: status,
        };
        if (status === PlanStatus.ACTIVE || status === PlanStatus.TRIALING) {
          updateData = {
            ...updateData,
            subscriptionType: getSubscriptionType(planItem.plan.product),
            subscriptionInterval:
              PlanInterval[
                planItem.plan.interval.toUpperCase() as keyof typeof PlanInterval
              ] ?? null,
            subscriptionStart: new Date(updatedSubscription.start_date * 1000),
            subscriptionEnd: new Date(
              updatedSubscription.current_period_end * 1000
            ),
            gotFreeTrial: updatedSubscription.trial_start
              ? true
              : user.gotFreeTrial,
          };
        } else if (
          status === PlanStatus.PAST_DUE ||
          status === PlanStatus.INCOMPLETE ||
          status === PlanStatus.UNPAID ||
          status === PlanStatus.CANCELED ||
          status === PlanStatus.INCOMPLETE_EXPIRED
        ) {
          updateData = {
            ...updateData,
            subscriptionType: null,
            subscriptionInterval: null,
            subscriptionStart: null,
            subscriptionEnd: null,
          };
        } else {
          // fallback dla nieoczekiwanych statusów
          console.warn(
            `Brak obsługi dla statusu: ${status} (ID subskrypcji: ${updatedSubscription.id}, user: ${user.id}, email: ${user.email})`
          );
        }
        await db.user.update({
          where: { id: user.id },
          data: updateData,
        });
        console.log(
          `Subscription for user ${user.id} (${user.email}) updated successfully. Status: ${status}, SubscriptionId: ${updatedSubscription.id}`
        );
      } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
      break;

    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription;
      const deletedCustomerId = deletedSubscription.customer as string;

      try {
        const user = await db.user.findFirst({
          where: { stripeCustomerId: deletedCustomerId },
        });

        if (!user) {
          console.error(
            `User with stripeCustomerId ${deletedCustomerId} not found. Subscription: ${deletedSubscription.id}`
          );
          throw new Error("User not found");
        }
        // Jawne mapowanie statusu na enum Prisma
        const status =
          PlanStatus[
            deletedSubscription.status.toUpperCase() as keyof typeof PlanStatus
          ] ?? PlanStatus.CANCELED;
        if (!status) {
          console.warn(
            `Nieoczekiwany status subskrypcji: ${deletedSubscription.status} (ID: ${deletedSubscription.id})`
          );
        }
        await db.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: null,
            subscriptionStatus: status,
            subscriptionType: null,
            subscriptionInterval: null,
            subscriptionStart: null,
            subscriptionEnd: null,
          },
        });

        console.log(
          `Subscription for user ${user.id} (${user.email}) deleted successfully. Status: ${status}, SubscriptionId: ${deletedSubscription.id}`
        );
      } catch (error) {
        console.error("Error deleting subscription:", error);
        return NextResponse.json(
          { error: "Failed to process subscription deletion" },
          { status: 500 }
        );
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
      return NextResponse.json(
        { error: `Unhandled event type: ${event.type}` },
        { status: 400 }
      );
  }

  return NextResponse.json({
    message: "Event processed successfully",
    eventType: event.type,
  });
}
