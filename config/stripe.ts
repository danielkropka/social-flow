export const STRIPE_PLANS = {
  basic: {
    key: "basic",
    id: "prod_RMU94PRJsMwxD4",
    name: "Podstawowy",
    monthlyPrice: 30,
    yearlyPrice: 288,
    priceId: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
    },
    description:
      "Idealne rozwiązanie dla początkujących twórców i małych firm, które chcą efektywnie zarządzać swoją obecnością w social mediach.",
    features: [
      "Do 5 połączonych kont social media",
      "Nieograniczona liczba zaplanowanych postów",
      "Podstawowe statystyki i analityka",
      "10 podstawowych szablonów postów",
    ],
  },
  creator: {
    key: "creator",
    id: "prod_RMUAeeAnYcfXEI",
    name: "Twórca",
    monthlyPrice: 60,
    yearlyPrice: 576,
    priceId: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    description:
      "Zaawansowane narzędzie dla profesjonalistów i firm, które chcą maksymalizować zasięgi i engagement swojego contentu.",
    features: [
      "Nielimitowana liczba kont social media",
      "Nieograniczona liczba zaplanowanych postów",
      "Szczegółowe statystyki i analityka",
      "30+ profesjonalnych szablonów postów",
      "Automatyczne sugestie najlepszych godzin publikacji",
    ],
  },
};
