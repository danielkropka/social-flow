import { db } from "@/lib/prisma";
import { PlanInterval } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const { userId, newPriceId } = await req.json();

    // Retrieve the user's current subscription ID from the database
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeSubscriptionId) {
      throw new Error("User or subscription not found.");
    }

    const subscriptionId = user.stripeSubscriptionId; // Ensure this is a string

    console.log(`Updating subscription with ID: ${subscriptionId}`);

    // Update the subscription with the new plan
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId, // Ensure this is a string
      {
        items: [
          {
            id: (
              await stripe.subscriptions.retrieve(subscriptionId)
            ).items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations", // Adjust billing for the remaining period
      }
    );

    // Update the user's subscription details in the database
    await db.user.update({
      where: { id: userId },
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

    console.log(`Subscription for user ID ${userId} updated successfully.`);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return new Response(null, { status: 500 });
  }
}
