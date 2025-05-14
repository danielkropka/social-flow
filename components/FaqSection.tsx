"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: "Jak długo trwa darmowy okres próbny?",
      answer:
        "Oferujemy 7-dniowy okres próbny, podczas którego możesz przetestować wszystkie funkcje platformy bez żadnych zobowiązań.",
    },
    {
      question: "Jakie platformy społecznościowe są wspierane?",
      answer:
        "Obecnie wspieramy Facebook, Instagram, Twitter oraz TikTok. Stale pracujemy nad dodawaniem nowych platform.",
    },
    {
      question: "Czy mogę zaplanować posty z wyprzedzeniem?",
      answer:
        "Tak, możesz zaplanować posty z dowolnym wyprzedzeniem czasowym. Nasza platforma automatycznie opublikuje je o wybranej porze.",
    },
    {
      question: "Jak mogę anulować subskrypcję?",
      answer:
        "Subskrypcję możesz anulować w dowolnym momencie w ustawieniach swojego konta. Nie stosujemy żadnych ukrytych opłat ani okresów zobowiązania.",
    },
    {
      question: "Czy mogę zmienić plan subskrypcji?",
      answer:
        "Tak, możesz zmienić plan subskrypcji w dowolnym momencie w ustawieniach swojego konta.",
    },
    {
      question: "Czy mogę otrzymać zwrot pieniędzy?",
      answer:
        "Tak, oferujemy 7-dniowy okres zwrotu pieniędzy, podczas którego możesz zrezygnować z subskrypcji bez żadnych dodatkowych kosztów.",
    },
  ];

  return (
    <section className="py-16 lg:py-24 relative" id="faq">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Często zadawane pytania
          </h2>
          <p className="text-lg text-gray-600">
            Znajdź odpowiedzi na najczęściej zadawane pytania
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 py-4 text-gray-600 border-t border-gray-100">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
