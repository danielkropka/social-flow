"use client";

import { Button } from "./ui/button";
import { useState, useTransition } from "react";
import { Check, Loader2, Shield, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { STRIPE_PLANS } from "@/config/stripe";
import { loadStripe } from "@stripe/stripe-js";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PricingSection() {
  const { data: session } = useSession();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, startTransition] = useTransition();
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const router = useRouter();

  const handleSubscribe = (priceId: string) => {
    startTransition(async () => {
      if (!session?.user) {
        router.push("/sign-in");
        return;
      }

      try {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        );

        if (!stripe) throw new Error("Wystąpił błąd podczas ładowania Stripe.");

        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            email: session?.user?.email,
            customerId: session?.user?.stripeCustomerId,
            isFreeTrial,
          }),
        });

        const checkoutSession = await response.json();

        if (checkoutSession.error) throw new Error(checkoutSession.error);

        await stripe.redirectToCheckout({ sessionId: checkoutSession.id });
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
          return;
        }
        toast.error("Wystąpił nieznany błąd podczas tworzenia sesji Stripe.");
      }
    });
  };

  return (
    <section className="py-20 lg:py-28 relative" id="pricing">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 leading-tight py-1">
            Przejrzyste ceny
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Wybierz plan dopasowany do Twoich potrzeb
          </p>
        </div>

        <div className="flex flex-col items-center gap-8 mb-20">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="inline-flex p-1.5 bg-gray-100 rounded-xl shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 sm:px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  !isAnnual
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Płatność miesięczna
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 sm:px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isAnnual
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Płatność roczna
                <span className="ml-2 inline-block px-2.5 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                  -20%
                </span>
              </button>
            </div>

            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer bg-white shadow-sm">
              <span className="text-sm font-medium text-gray-900">
                Bezpłatna wersja próbna
              </span>
              <Switch
                checked={isFreeTrial}
                onCheckedChange={() => {
                  setIsFreeTrial(!isFreeTrial);
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {Object.values(STRIPE_PLANS).map((plan) => (
            <div
              key={plan.id}
              className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 relative z-10">
                {plan.name}
              </h3>
              <p className="mt-3 text-gray-600 text-sm relative z-10">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline relative z-10">
                <span className="text-5xl font-bold text-gray-900">
                  {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="ml-2 text-gray-600">
                  zł/{isAnnual ? "rok" : "miesiąc"}
                </span>
              </div>
              {isAnnual && (
                <div className="mt-2 text-green-600 text-sm font-medium relative z-10">
                  Oszczędzasz{" "}
                  {(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(0)} zł
                  rocznie
                </div>
              )}
              <ul className="mt-8 space-y-4 mb-8 relative z-10">
                {plan.features.map((feature, index) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 group/item"
                  >
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 group-hover/item:scale-110 transition-transform duration-200" />
                    <span
                      className={`text-gray-600 group-hover/item:text-gray-900 transition-colors duration-200 ${
                        feature === "Nielimitowane połączenia kont"
                          ? "animate-gradient"
                          : ""
                      } ${index === 0 ? "font-semibold" : ""}`}
                      data-text={
                        feature === "Nielimitowane połączenia kont"
                          ? feature
                          : ""
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 h-12 flex items-center justify-center rounded-lg font-medium relative z-10"
                onClick={() =>
                  handleSubscribe(
                    isAnnual ? plan.priceId.yearly! : plan.priceId.monthly!
                  )
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {isFreeTrial
                      ? "Wypróbuj za darmo przez 7 dni"
                      : "Wybierz plan"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center gap-1.5 relative z-10">
                <Shield className="h-3.5 w-3.5" />
                Bezpieczna płatność przez Stripe
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
