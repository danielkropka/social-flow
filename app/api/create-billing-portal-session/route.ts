import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { customerId } = body as { customerId?: string };

    if (!customerId || typeof customerId !== "string") {
      console.warn("Brak customerId lub nieprawidłowy typ:", customerId);
      return NextResponse.json(
        { error: "Nieprawidłowy lub brakujący customerId" },
        { status: 400 }
      );
    }

    const findCustomer = await stripe.customers.retrieve(customerId);
    if (
      !findCustomer ||
      (typeof findCustomer === "object" &&
        "deleted" in findCustomer &&
        findCustomer.deleted)
    ) {
      console.warn(
        "Nie znaleziono klienta Stripe lub został usunięty:",
        customerId
      );
      return NextResponse.json(
        { error: "Klient Stripe nie istnieje lub został usunięty" },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `https://www.social-flow.pl/dashboard`,
    });

    console.log(
      `Utworzono sesję billing portal dla klienta: ${customerId}, url: ${session.url}`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Błąd podczas tworzenia sesji billing portal:", error);
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
