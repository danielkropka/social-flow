"use client";

import { buttonVariants } from "./ui/button";

import Link from "next/link";
import { cn } from "@/lib/utils/utils";
import { ArrowDown } from "./icons/ArrowDown";
import { Check } from "./icons/Check";

export default function HeroSection() {
  const advantages = [
    {
      text: "Publikacja na wszystkich platformach za jednym kliknięciem",
      icon: (
        <Check className="w-6 h-6 text-blue-600 flex-shrink-0 animate-hero-icon" />
      ),
    },
    {
      text: "Intuicyjny, nowoczesny interfejs",
      icon: (
        <Check className="w-6 h-6 text-blue-600 flex-shrink-0 animate-hero-icon" />
      ),
    },
    {
      text: "Automatyczne planowanie postów",
      icon: (
        <Check className="w-6 h-6 text-blue-600 flex-shrink-0 animate-hero-icon" />
      ),
    },
    {
      text: "Oszczędność czasu i pieniędzy",
      icon: (
        <Check className="w-6 h-6 text-blue-600 flex-shrink-0 animate-hero-icon" />
      ),
    },
  ];

  const handleScrollToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    const section = document.querySelector(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Tło z efektami świetlnymi i gradientami */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Zawartość */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto mt-16 lg:mt-28 px-4 xl:px-12 gap-8 lg:gap-16 mb-8">
          <div className="flex flex-col w-full max-w-full lg:w-1/2 lg:max-w-2xl xl:max-w-3xl">
            <div className="min-h-[200px] lg:min-h-[300px]">
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight drop-shadow-hero mb-2">
                Publikuj na wszystkich socialach jednym kliknięciem
              </h1>
              <span className="mt-2 text-blue-600 text-xl lg:text-2xl font-semibold block drop-shadow-hero-glow">
                Oszczędzaj czas i rozwijaj swój biznes!
              </span>
              <span className="mt-4 text-lg lg:text-xl text-gray-600 block font-medium">
                Twórz, planuj i publikuj posty na wszystkich swoich profilach
                społecznościowych w kilka sekund.
                <br />
                Skup się na tym, co naprawdę ważne — kreatywności.
              </span>
            </div>

            <ul className="flex flex-col gap-2 mt-5 text-lg min-h-[180px] bg-white/80 rounded-2xl border border-blue-100 p-4 shadow-xl backdrop-blur-xl list-none">
              {advantages.map((adv, i) => (
                <li key={adv.text} className="flex items-center gap-3 group">
                  <span className="transition-transform group-hover:scale-110 group-hover:text-blue-700 duration-200">
                    {adv.icon}
                  </span>
                  <span className="text-gray-700 font-medium group-hover:text-blue-700 transition-colors duration-200">
                    {adv.text}
                  </span>
                </li>
              ))}
            </ul>

            <section className="flex flex-col mt-10 w-full lg:w-1/2">
              <Link
                href="#pricing"
                onClick={(e) => handleScrollToSection(e, "#pricing")}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-14 text-lg relative overflow-hidden group bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white border-0 shadow-hero-cta hover:scale-105 transition-transform duration-200 focus:ring-4 focus:ring-blue-300 focus:outline-none rounded-2xl"
                )}
                aria-label="Wypróbuj za darmo"
              >
                <span className="relative z-10 flex items-center gap-2 font-bold tracking-wide">
                  Wypróbuj za darmo
                  <ArrowDown className="w-6 h-6 animate-bounce" />
                </span>
                {/* Shine efekt na CTA */}
                <span className="absolute left-0 top-0 w-full h-full pointer-events-none">
                  <span className="absolute left-[-75%] top-0 w-1/2 h-full bg-gradient-to-r from-white/60 to-transparent rounded-2xl blur-lg opacity-0 group-hover:opacity-80 group-hover:left-[120%] transition-all duration-700 ease-out animate-shine" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </Link>
              <span className="mt-2 text-sm text-gray-500 text-center">
                Wymagana karta kredytowa.
              </span>
            </section>
          </div>

          <div
            className="flex-1 relative justify-center items-center lg:flex hidden"
            style={{}}
          >
            <div className="relative w-full max-w-[800px] bg-white/80 backdrop-blur-2xl rounded-3xl shadow-hero-card border border-blue-100 p-4 lg:p-8 mx-4 lg:mx-0 transition-all duration-300 hover:shadow-hero-card-glow hover:scale-[1.03] group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer" />
                <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer" />
                <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer" />
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                  <div className="flex gap-2">
                    <div className="w-6 lg:w-8 h-6 lg:h-8 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                      <svg
                        className="w-3 lg:w-4 h-3 lg:h-4 text-[#1877F2]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-label="Facebook"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="w-6 lg:w-8 h-6 lg:h-8 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                      <svg
                        className="w-3 lg:w-4 h-3 lg:h-4 text-[#E4405F]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-label="Instagram"
                      >
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs lg:text-sm text-gray-600 font-medium">
                    Wybrane platformy
                  </span>
                </div>

                <div className="w-full h-24 lg:h-32 bg-white/90 rounded-2xl border-2 border-gradient-to-r from-blue-200 via-fuchsia-200 to-blue-100 border-dashed flex items-center justify-center p-4 hover:border-blue-400 hover:bg-blue-50/60 transition-all duration-200 cursor-pointer group shadow-md">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-gray-400 group-hover:text-blue-400 transition-colors animate-hero-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Upload"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-xs lg:text-sm text-gray-500 group-hover:text-blue-600 text-center transition-colors">
                      Przeciągnij i upuść zdjęcia lub kliknij, aby wybrać
                    </span>
                  </div>
                </div>

                <div className="w-full h-20 lg:h-24 bg-white/90 rounded-2xl border border-gray-200 p-3 hover:border-gray-300 transition-colors shadow-sm">
                  <div className="w-2/3 h-3 lg:h-4 bg-gray-100 rounded mb-2 animate-pulse" />
                  <div className="w-1/2 h-3 lg:h-4 bg-gray-100 rounded animate-pulse" />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 lg:w-8 h-6 lg:h-8 rounded bg-white border border-gray-200 hover:border-gray-300 transition-colors" />
                    <div className="w-16 lg:w-24 h-3 lg:h-4 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <button className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white rounded-xl text-sm lg:text-base font-semibold shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-blue-300 focus:outline-none border-0">
                    Zaplanuj post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
