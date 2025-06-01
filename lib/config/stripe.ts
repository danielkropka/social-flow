export const STRIPE_PLANS = {
  basic: {
    key: "basic",
    id: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRODUCT_ID,
    name: "Podstawowy",
    monthlyPrice: 30,
    yearlyPrice: 288,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
    },
    description:
      "Idealne rozwiązanie dla początkujących twórców i małych firm, które chcą efektywnie zarządzać swoją obecnością w social mediach.",
    features: [
      "Do 5 połączonych kont social media",
      "Publikacja postów",
      "Planowanie postów",
    ],
  },
  creator: {
    key: "creator",
    id: process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRODUCT_ID,
    name: "Twórca",
    monthlyPrice: 60,
    yearlyPrice: 576,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID,
    },
    description:
      "Zaawansowane narzędzie dla profesjonalistów i firm, które chcą maksymalizować zasięgi i engagement swojego contentu.",
    features: [
      "Nielimitowane połączenia kont",
      "Publikacja postów",
      "Planowanie postów",
      "Studio treści",
      "Automatyczne sugestie najlepszych godzin publikacji",
    ],
  },
};
