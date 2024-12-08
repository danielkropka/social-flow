"use client";

import { useState } from "react";
import { STRIPE_PLANS } from "@/config/stripe";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PlansPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<
    "monthly" | "yearly"
  >("monthly");

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          interval: selectedInterval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Przekieruj do Stripe Checkout
      window.location.href = data.url;
    } catch (error: Error | unknown) {
      console.error("Subscription error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Wybierz plan</h1>
        <p className="text-gray-600">
          Wybierz plan, który najlepiej odpowiada Twoim potrzebom
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <Button
            variant={selectedInterval === "monthly" ? "default" : "ghost"}
            onClick={() => setSelectedInterval("monthly")}
          >
            Miesięcznie
          </Button>
          <Button
            variant={selectedInterval === "yearly" ? "default" : "ghost"}
            onClick={() => setSelectedInterval("yearly")}
          >
            Rocznie
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {Object.entries(STRIPE_PLANS).map(([key, plan]) => (
          <div key={key} className="border rounded-xl p-6 bg-white shadow-sm">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleSubscribe(plan.id)}
              disabled={isLoading}
            >
              {isLoading ? "Ładowanie..." : "Wybierz plan"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
