export const STRIPE_PLANS = {
  basic: {
    key: "basic",
    id: "prod_SLL644LgxEPvXa",
    name: "Podstawowy",
    monthlyPrice: 30,
    yearlyPrice: 288,
    priceId: {
      monthly: "price_1RQePvBwgdNuxyCVjZGHv9xz",
      yearly: "price_1RQeQwBwgdNuxyCV7AHluvwm",
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
    id: "prod_SLL8g888ONmTYg",
    name: "Twórca",
    monthlyPrice: 60,
    yearlyPrice: 576,
    priceId: {
      monthly: "price_1RQeS9BwgdNuxyCVTxC74BLt",
      yearly: "price_1RQeS9BwgdNuxyCVJZhzOlgY",
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
