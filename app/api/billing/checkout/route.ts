import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/config/prisma";
import { withMiddlewareRateLimit } from "@/middleware/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CreateCheckoutSessionBody = {
  priceId: string;
  email: string;
  customerId: string | undefined;
  isFreeTrial: boolean;
};

async function hasUsedTrialBefore(customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
  });

  return subscriptions.data.some(
    (subscription) =>
      subscription.trial_start != null && subscription.trial_end != null
  );
}

export async function POST(req: NextRequest) {
  return withMiddlewareRateLimit(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { priceId, email, customerId, isFreeTrial } =
        body as CreateCheckoutSessionBody;

      const sessionOptions: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        tax_id_collection: {
          enabled: true,
        },
        mode: "subscription",
        success_url: `${req.headers.get(
          "origin"
        )}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/?cancel`,
      };

      if (isFreeTrial) {
        if (customerId) {
          const user = await db.user.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (user && (await hasUsedTrialBefore(customerId))) {
            throw new Error("TrialAlreadyUsed");
          }

          sessionOptions.customer = customerId;
          sessionOptions.customer_update = { name: "auto" };
        } else {
          sessionOptions.customer_email = email;
        }

        sessionOptions.subscription_data = {
          trial_period_days: 7,
        };
      } else {
        sessionOptions.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionOptions);

      if (!session.id) {
        throw new Error("Nie udało się utworzyć sesji checkout");
      }

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
  })(req);
}
