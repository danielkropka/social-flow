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
      icon: <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    },
    {
      text: "Intuicyjny, nowoczesny interfejs",
      icon: <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    },
    {
      text: "Automatyczne planowanie postów",
      icon: <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    },
    {
      text: "Oszczędność czasu i pieniędzy",
      icon: <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    },
  ];

  const handleScrollToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();
    const section = document.querySelector(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section aria-label="Sekcja hero" className="relative">
      {/* Zawartość */}
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 xl:px-12">
          {/* Główny blok hero */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-20 lg:pt-28 pb-10">
            {/* Tekst lewa kolumna */}
            <header className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-sm text-blue-700 shadow-sm backdrop-blur">
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse motion-reduce:animate-none" />
                Publikuj szybciej. Planowanie mądrzej.
              </div>
              <h1 className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Publikuj na wszystkich socialach jednym kliknięciem
              </h1>
              <p className="mt-4 text-lg text-gray-600 sm:text-xl">
                Twórz, planuj i publikuj posty w kilku sekundach. Zadbaj o
                spójność komunikacji i odzyskaj czas na kreatywność.
              </p>
              {/* Lista korzyści – 2 kolumny na desktopie */}
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {advantages.map((adv) => (
                  <li
                    key={adv.text}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/70 px-3 py-2 shadow-sm backdrop-blur transition-colors hover:border-blue-200"
                  >
                    <span className="shrink-0 rounded-md bg-blue-50 p-1.5 ring-1 ring-inset ring-blue-100">
                      {adv.icon}
                    </span>
                    <span className="text-gray-700 text-sm sm:text-base">
                      {adv.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="#pricing"
                  onClick={(e) => handleScrollToSection(e, "#pricing")}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 text-base font-semibold rounded-xl",
                    "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white border-0 shadow-md hover:shadow-lg",
                    "transition-transform duration-200 hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-blue-300",
                  )}
                  aria-label="Wypróbuj za darmo"
                >
                  Rozpocznij za darmo
                </Link>

                <Link
                  href="#features"
                  onClick={(e) => handleScrollToSection(e, "#features")}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 text-base font-semibold rounded-xl",
                    "border-gray-200 bg-white/70 backdrop-blur hover:bg-white",
                  )}
                  aria-label="Zobacz funkcje"
                >
                  <span className="inline-flex items-center gap-2">
                    Zobacz funkcje
                    <ArrowDown className="h-5 w-5" />
                  </span>
                </Link>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Wymagana karta kredytowa.
              </p>

              {/* Social proof */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white/70 px-3 py-1 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  99.9% skuteczność publikacji
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white/70 px-3 py-1 shadow-sm">
                  ★★★★★ Zaufanie marketerów
                </div>
              </div>
            </header>

            {/* Podgląd prawa kolumna */}
            <div className="relative hidden lg:block">
              {/* Dekoracyjna obwódka/poświata */}
              <div
                aria-hidden
                className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-sky-400/20 to-fuchsia-400/20 blur-2xl"
              />
              <div className="relative rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
                {/* Pasek okna */}
                <div className="mb-5 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>

                {/* Makieta: upload + szkielety + CTA */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-5 text-center transition-colors hover:border-blue-300">
                    <div className="mx-auto mb-2 h-10 w-10 rounded-lg bg-blue-50 text-blue-500 grid place-items-center">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Przeciągnij i upuść media lub kliknij, aby wybrać
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                    <div className="mb-2 h-4 w-2/3 rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md border border-gray-200 bg-white/80" />
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 px-4 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                    >
                      Zaplanuj post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}