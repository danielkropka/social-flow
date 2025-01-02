import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { STRIPE_PLANS } from "@/config/stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { planId, interval } = body as {
      planId: keyof typeof STRIPE_PLANS;
      interval: "monthly" | "yearly";
    };

    // Pobierz aktualną subskrypcję użytkownika
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.stripeSubscriptionId) {
      // Zaktualizuj istniejącą subskrypcję
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [
          {
            id: user.stripeSubscriptionId,
            price: STRIPE_PLANS[planId].priceId[interval],
          },
        ],
      });

      return NextResponse.json({
        message: "Subscription updated",
        toast: {
          title: "Sukces",
          description: `Twoja subskrypcja została pomyślnie zaktualizowana do planu ${STRIPE_PLANS[planId].name}`,
        },
      });
    } else {
      // Utwórz nową sesję checkout
      const checkoutSession = await stripe.checkout.sessions.create({
        client_reference_id: session.user.id,
        customer_email: session.user.email!,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: STRIPE_PLANS[planId].priceId[interval],
            quantity: 1,
          },
        ],
        metadata: {
          planId,
          interval,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      });

      return NextResponse.json({
        url: checkoutSession.url,
        toast: {
          title: "Przekierowanie",
          description: "Przekierowujemy Cię do strony płatności...",
        },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
