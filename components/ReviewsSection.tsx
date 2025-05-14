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
      "Social Flow znacząco usprawniło naszą pracę. Oszczędzamy mnóstwo czasu na planowaniu postów, a interfejs jest intuicyjny i przyjemny w użyciu.",
    avatar: "/avatars/avatar-1.png",
  },
  {
    name: "Marek Nowak",
    title: "Marketing Director",
    rating: 5,
    content:
      "Najlepsze narzędzie do zarządzania social mediami, z jakiego korzystałem. Wszystko w jednym miejscu, bez zbędnych komplikacji.",
    avatar: "/avatars/avatar-2.png",
  },
  {
    name: "Karolina Wiśniewska",
    title: "Content Creator",
    rating: 5,
    content:
      "Dzięki Social Flow mogę się skupić na tworzeniu treści, zamiast tracić czas na żmudne publikowanie na różnych platformach.",
    avatar: "/avatars/avatar-3.png",
  },
];

export default function ReviewsSection() {
  return (
    <section className="py-16 lg:py-24 relative" id="reviews">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Zaufali nam
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dołącz do grona zadowolonych klientów, którzy już usprawniają swoją
            komunikację w mediach społecznościowych
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:-translate-y-1 animate-fade-in-up"
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

        {/* <div className="text-center mt-12">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
            Zobacz więcej opinii
          </button>
        </div> */}
      </div>
    </section>
  );
}
