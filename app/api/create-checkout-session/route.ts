import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, email } = body;

    console.log("Received request with:", { priceId, email });

    // Validate that priceId and email are provided
    if (!priceId || !email) {
      console.error("Missing required fields: priceId or email");
      return NextResponse.json(
        { error: "Missing required fields: priceId or email" },
        { status: 400 }
      );
    }

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer_email: email,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get(
          "origin"
        )}/?success?session_id={CHECKOUT_SESSION_ID}`,
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
