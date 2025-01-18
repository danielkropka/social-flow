import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let { customerId } = body as {
      customerId: string | undefined;
    };

    let session: Stripe.BillingPortal.Session;

    if (customerId) {
      const findCustomer = await stripe.customers.retrieve(customerId);
      if (!findCustomer || findCustomer.deleted) {
        customerId = undefined;
        throw new Error("Customer not found");
      }

      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.get("origin")}#pricing`,
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating billing portal session:", error);
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
}
