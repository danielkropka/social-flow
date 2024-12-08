import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { STRIPE_PLANS } from "@/config/stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body); // Debug log

    const { planId, interval } = body;

    // Debug logs
    console.log("Looking for plan:", planId);
    console.log("Available plans:", Object.keys(STRIPE_PLANS));

    const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];
    if (!plan) {
      return NextResponse.json(
        {
          error: `Invalid plan: ${planId}. Available plans: ${Object.keys(
            STRIPE_PLANS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const priceId = plan.priceId[interval as keyof typeof plan.priceId];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email!,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        planId: plan.id,
        interval,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
