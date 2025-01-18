import { STRIPE_PLANS } from "@/config/stripe";
import { PlanInterval } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { priceId, email, customerId, planKey, interval, isFreeTrial } =
      body as {
        priceId: string;
        email: string;
        customerId: string | undefined;
        planKey: keyof typeof STRIPE_PLANS;
        interval: PlanInterval;
        isFreeTrial: boolean;
      };

    if (isFreeTrial && customerId) {
      const user = await db.user.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (user?.gotFreeTrial) {
        return NextResponse.json(
          { error: "Już korzystałeś z bezpłatnego okresu próbnego." },
          { status: 400 }
        );
      }
    }

    const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];

    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : { customer_email: email }),
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
        gotFreeTrial: isFreeTrial ? "true" : "false",
      },
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true,
      },
      ...(customerId && {
        customer_update: {
          name: "auto",
        },
      }),
      mode: "subscription",
      ...(isFreeTrial && {
        subscription_data: {
          trial_period_days: 7,
        },
      }),
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
