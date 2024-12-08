export const STRIPE_PLANS = {
  basic: {
    // zmienione z BASIC na basic
    name: "Basic",
    id: "basic",
    priceId: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
    },
    features: [
      "Do 10 postów miesięcznie",
      "Podstawowe statystyki",
      "Wsparcie email",
    ],
  },
  pro: {
    // zmienione z PRO na pro
    name: "Pro",
    id: "pro",
    priceId: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    features: [
      "Nielimitowane posty",
      "Zaawansowane statystyki",
      "Priorytetowe wsparcie",
      "Niestandardowe raporty",
    ],
  },
};
