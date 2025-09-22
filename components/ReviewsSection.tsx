"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "@/components/ui/star";

interface Review {
  name: string;
  title: string;
  rating: number;
  content: string;
  avatar: string;
}

const reviews: Review[] = [
  {
    name: "Anna Kowalska",
    title: "Social Media Manager",
    rating: 5,
    content:
      "Social Flow zrewolucjonizowało nasze podejście do zarządzania mediami społecznościowymi. Dzięki intuicyjnemu interfejsowi i zaawansowanym funkcjom planowania, zwiększyliśmy naszą efektywność o 300%.",
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Anna Kowalska`,
  },
  {
    name: "Marek Nowak",
    title: "Marketing Director",
    rating: 5,
    content:
      "Najbardziej zaawansowane narzędzie do zarządzania wieloma platformami społecznościowymi. Integracja wszystkich kanałów w jednym miejscu pozwoliła nam na spójną komunikację marki.",
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Marek Nowak`,
  },
  {
    name: "Karolina Wiśniewska",
    title: "Content Creator",
    rating: 5,
    content:
      "Social Flow umożliwiło mi skupienie się na kreatywności, eliminując czasochłonne procesy publikacji. Automatyzacja pozwoliła mi zwiększyć produktywność i jakość treści.",
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Karolina Wisniewska`,
  },
];

export default function ReviewsSection() {
  return (
    <section className="py-16 lg:py-24 relative" id="reviews">
      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 xl:px-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-sm text-blue-700 shadow-sm backdrop-blur mb-6">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse motion-reduce:animate-none" />
              Opinie naszych klientów
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Dołącz do tysięcy zadowolonych użytkowników
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Zobacz, jak Social Flow pomaga firmom i twórcom osiągać lepsze wyniki w mediach społecznościowych
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="group relative bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 animate-fade-in-up"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300">
                  <AvatarImage src={review.avatar} alt={review.name} />
                  <AvatarFallback className="bg-blue-50 text-blue-600">
                    {review.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {review.name}
                  </h3>
                  <p className="text-sm text-gray-600">{review.title}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 transition-transform duration-300 ${
                      i < review.rating
                        ? "text-blue-600 fill-blue-600 group-hover:scale-110"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
