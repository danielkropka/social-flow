import { STRIPE_PLANS } from "@/config/stripe";
import { PlanInterval } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, email, customerId, planKey, interval } = body as {
      priceId: string;
      email: string;
      customerId: string | undefined;
      planKey: keyof typeof STRIPE_PLANS;
      interval: PlanInterval;
    };

    // Validate that priceId and email are provided
    if (!priceId || !email) {
      console.error("Missing required fields: priceId or email");
      return NextResponse.json(
        { error: "Missing required fields: priceId or email" },
        { status: 400 }
      );
    }

    const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          subscriptionType: plan.key.toUpperCase(),
          subscriptionInterval: interval,
        },
        allow_promotion_codes: true,
        tax_id_collection: {
          enabled: true,
        },
        customer_update: {
          name: "auto",
        },
        mode: "subscription",
        success_url: `${req.headers.get(
          "origin"
        )}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/?cancel`,
      });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
