"use client";

import { useState, useEffect } from "react";
import { buttonVariants } from "./ui/button";
import PricingSection from "./PricingSection";
import PlatformsSection from "./PlatformsSection";
import ReviewsSection from "./ReviewsSection";
import { motion } from "framer-motion";
import FaqSection from "./FaqSection";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Inicjalne ustawienie
    handleResize();

    // Nasłuchiwanie na zmiany rozmiaru okna
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const advantages = [
    "Publikacja na wielu kontach społecznościowych",
    "Intuicyjny interfejs",
    "Planowanie z wyprzedzeniem",
    "Oszczędność czasu i pieniędzy (zaczynając od 30 zł/miesiąc)",
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  };

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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto mt-24 lg:mt-32 px-4 gap-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8 }}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: isMobile ? "100%" : "32rem",
            }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-gray-900">
              Przestań skakać między aplikacjami &mdash;&nbsp;
              <span className="text-blue-600">publikuj posty tu i teraz</span>.
            </h1>
            <span className="mt-4 text-lg lg:text-xl text-gray-600">
              <span className="text-blue-600 font-semibold">
                Jedno narzędzie
              </span>{" "}
              do jednoczesnego wrzucania treści na wszystkie Twoje profile
              społecznościowe.&nbsp;
              <span className="text-blue-600 font-semibold">
                Zaoszczędź czas
              </span>{" "}
              i skup się na tworzeniu świetnego contentu.
            </span>
            <div className="flex flex-col gap-2 mt-4 text-lg">
              {advantages.map((advantage, i) => (
                <motion.div
                  key={advantage}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-600">{advantage}</span>
                </motion.div>
              ))}
            </div>
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "3rem",
                width: isMobile ? "100%" : "50%",
              }}
            >
              <Link
                href="#pricing"
                onClick={(e) => handleScrollToSection(e, "#pricing")}
                className={cn(
                  buttonVariants(),
                  "h-12 text-lg relative overflow-hidden group bg-white border-2 border-blue-600 text-blue-600 hover:text-white"
                )}
              >
                <span className="relative z-10">Wypróbuj za darmo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </motion.section>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="relative w-full max-w-[800px] bg-gray-50/50 rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mx-4 lg:mx-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-red-400" />
                <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-yellow-400" />
                <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-green-400" />
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center gap-3 mb-4 lg:mb-6">
                  <div className="flex gap-2">
                    <div className="w-6 lg:w-8 h-6 lg:h-8 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <svg
                        className="w-3 lg:w-4 h-3 lg:h-4 text-[#1877F2]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="w-6 lg:w-8 h-6 lg:h-8 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <svg
                        className="w-3 lg:w-4 h-3 lg:h-4 text-[#E4405F]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs lg:text-sm text-gray-500">
                    Wybrane platformy
                  </span>
                </div>

                <div className="w-full h-24 lg:h-32 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-4">
                  <span className="text-xs lg:text-sm text-gray-500 text-center">
                    Przeciągnij i upuść zdjęcia lub kliknij, aby wybrać
                  </span>
                </div>

                <div className="w-full h-20 lg:h-24 bg-white rounded-lg border border-gray-200 p-3">
                  <div className="w-2/3 h-3 lg:h-4 bg-gray-100 rounded mb-2" />
                  <div className="w-1/2 h-3 lg:h-4 bg-gray-100 rounded" />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 lg:w-8 h-6 lg:h-8 rounded bg-white border border-gray-200" />
                    <div className="w-16 lg:w-24 h-3 lg:h-4 bg-gray-100 rounded" />
                  </div>
                  <button className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gray-900 text-white rounded-lg text-sm lg:text-base hover:bg-gray-800 transition-colors">
                    Zaplanuj post
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <ReviewsSection />
        <PlatformsSection />
        <PricingSection />
        <FaqSection />
      </div>
    </div>
  );
}
