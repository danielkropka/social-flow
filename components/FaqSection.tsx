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
      question: "Jak długo trwa bezpłatny okres próbny?",
      answer:
        "Oferujemy 7-dniowy bezpłatny okres próbny z pełnym dostępem do wszystkich funkcji platformy. Nie wymagamy podania danych karty kredytowej, a anulowanie jest możliwe w każdej chwili.",
    },
    {
      question: "Jakie platformy społecznościowe są obsługiwane?",
      answer:
        "Obecnie integrujemy się z Facebook, Instagram, Twitter (X), TikTok, LinkedIn i YouTube. Stale rozszerzamy nasze wsparcie o nowe platformy zgodnie z potrzebami naszych użytkowników.",
    },
    {
      question: "Czy mogę zaplanować publikacje z wyprzedzeniem?",
      answer:
        "Tak, nasza platforma umożliwia planowanie postów z dowolnym wyprzedzeniem czasowym. Możesz tworzyć kalendarze treści na tygodnie i miesiące do przodu z automatyczną publikacją.",
    },
    {
      question: "Jak mogę anulować subskrypcję?",
      answer:
        "Anulowanie subskrypcji jest możliwe w każdej chwili poprzez panel ustawień konta. Nie stosujemy okresów zobowiązania ani ukrytych opłat - masz pełną kontrolę nad swoją subskrypcją.",
    },
    {
      question: "Czy mogę zmienić plan subskrypcji?",
      answer:
        "Tak, możesz zmieniać plany subskrypcji w dowolnym momencie. Zmiany są natychmiastowe, a różnice w opłatach są rozliczane proporcjonalnie.",
    },
    {
      question: "Jakie są zasady zwrotu środków?",
      answer:
        "Z uwagi na cyfrowy charakter naszych usług, nie oferujemy zwrotów środków po rozpoczęciu subskrypcji. Zachęcamy do skorzystania z bezpłatnego okresu próbnego, aby dokładnie przetestować platformę przed zakupem.",
    },
  ];

  return (
    <section className="py-16 lg:py-24 relative" id="faq">
      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto max-w-3xl px-4 xl:px-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-sm text-blue-700 shadow-sm backdrop-blur mb-6">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse motion-reduce:animate-none" />
              Centrum pomocy
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Najczęściej zadawane pytania
            </h2>
            <p className="text-lg text-gray-600">
              Znajdź odpowiedzi na pytania dotyczące naszej platformy i usług
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl overflow-hidden animate-fade-in-up transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50/50 transition-colors duration-200"
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
      </div>
    </section>
  );
}