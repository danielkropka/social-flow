"use client";

import { Button } from "./ui/button";
import { useState } from "react";
import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { STRIPE_PLANS } from "@/config/stripe";
import { loadStripe } from "@stripe/stripe-js";

export default function PricingSection() {
  const { data: session, update } = useSession();
  const [isAnnual, setIsAnnual] = useState(false);

  const handleSubscribe = async (priceId: string, key: string) => {
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId,
        email: session?.user?.email,
        planKey: key,
        interval: isAnnual ? "YEAR" : "MONTH",
      }),
    });

    const checkoutSession = await response.json();

    if (checkoutSession.id) {
      await stripe?.redirectToCheckout({ sessionId: checkoutSession.id });
    }

    await update();
  };

  return (
    <section className="py-16 lg:py-24 relative" id="pricing">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Przejrzyste ceny
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Wybierz plan dopasowany do Twoich potrzeb
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Płatność miesięczna
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Płatność roczna
              <span className="ml-2 inline-block px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.values(STRIPE_PLANS).map((plan) => (
            <div
              key={plan.id}
              className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm flex flex-col transform transition-transform duration-200 hover:-translate-y-1"
            >
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-gray-600 text-sm">{plan.description}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="ml-1 text-gray-600">
                  zł/{isAnnual ? "rok" : "miesiąc"}
                </span>
              </div>
              {isAnnual && (
                <div className="mt-1 text-green-600 text-sm">
                  Oszczędzasz{" "}
                  {(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(0)} zł
                  rocznie
                </div>
              )}
              <ul className="mt-6 space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span
                      className={`text-gray-600 ${
                        index === 0 ? "font-semibold" : ""
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full bg-gray-900 text-white hover:bg-gray-800 transition-colors h-12 flex items-center justify-center"
                onClick={() =>
                  handleSubscribe(
                    isAnnual ? plan.priceId.yearly! : plan.priceId.monthly!,
                    plan.key
                  )
                }
                disabled={
                  session?.user?.subscriptionType === plan.key.toUpperCase() &&
                  session?.user?.subscriptionStatus === "ACTIVE"
                }
              >
                Wybierz plan
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
