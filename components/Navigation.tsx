"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { getInitials } from "@/lib/utils/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("#reviews");
  const { data: session } = useSession();
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const sections = ["#reviews", "#platforms", "#pricing", "#faq"] as const;

  useEffect(() => {
    const handleScrollShadow = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScrollShadow, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollShadow);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveId(`#${visible.target.id}`);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // ... existing code ...
  const toggleMenu = () => setIsOpen((s) => !s);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
  };

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const { style } = document.body;
    if (isOpen) {
      const prev = style.overflow;
      style.overflow = "hidden";
      return () => {
        style.overflow = prev || "";
      };
    }
  }, [isOpen]);

  const AuthButtons = () => {
    if (session?.user) {
      return (
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-full px-4 py-2"
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full"
              />
            ) : (
              <span className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                {getInitials(session.user.name ?? "")}
              </span>
            )}
            <span className="truncate max-w-[10rem]">
              {session.user.name || "Użytkownik"}
            </span>
          </Button>
        </Link>
      );
    }

    return (
      <>
        <Link href="/sign-in">
          <Button variant="outline" className="rounded-full px-4 py-2">
            Zaloguj się
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button className="rounded-full px-4 py-2 text-white bg-gradient-to-r from-blue-500 to-blue-600">
            Rozpocznij za darmo
          </Button>
        </Link>
      </>
    );
  };

  return (
    <>
      {/* Skip link (A11y) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Przejdź do treści
      </a>

      <nav
        className={[
          "font-sans fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/70 dark:border-gray-800/70 shadow-md"
            : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-transparent",
        ].join(" ")}
        role="navigation"
        aria-label="Główna nawigacja"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link
              href="/"
              className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-blue-700 transition-colors"
              aria-label="Strona główna"
            >
              Social Flow
            </Link>

            {/* Desktop menu */}
            <div className="hidden lg:flex items-center gap-10">
              {sections.map((id) => (
                <Link
                  key={id}
                  href={id}
                  onClick={(e) => scrollTo(e, id)}
                  className={[
                    "relative px-2 text-[15px] md:text-lg font-medium transition-colors",
                    "text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400",
                  ].join(" ")}
                  aria-current={activeId === id ? "page" : undefined}
                >
                  <span>
                    {id === "#reviews"
                      ? "Opinie"
                      : id === "#platforms"
                        ? "Platformy"
                        : id === "#pricing"
                          ? "Cennik"
                          : "FAQ"}
                  </span>
                  <span
                    className={[
                      "pointer-events-none absolute left-0 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300",
                      activeId === id ? "w-full opacity-100" : "w-0 opacity-0",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </Link>
              ))}
              <div className="flex items-center gap-6">
                <AuthButtons />
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              onKeyDown={handleKeyDown}
              className="lg:hidden p-3 rounded-xl transition-colors active:scale-95 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? (
                <X className="h-7 w-7 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-7 w-7 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay + sheet moved OUTSIDE nav to avoid stacking issues */}
      <div
        ref={backdropRef}
        className={[
          "lg:hidden fixed inset-0 z-[60] transition-opacity",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={(e) => {
          if (e.target === backdropRef.current) setIsOpen(false);
        }}
        aria-hidden={!isOpen}
      >
        <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
        <div
          id="mobile-menu"
          className={[
            "absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800",
            "shadow-xl transition-transform duration-300",
            isOpen ? "translate-x-0" : "translate-x-full",
            "rounded-l-2xl z-[61]",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Menu mobilne"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Menu
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Zamknij menu"
            >
              <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <div className="px-4 py-6 space-y-2">
            {sections.map((id) => (
              <Link
                key={id}
                href={id}
                onClick={(e) => scrollTo(e, id)}
                className={[
                  "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                  activeId === id
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                ].join(" ")}
                aria-current={activeId === id ? "page" : undefined}
              >
                {id === "#reviews"
                  ? "Opinie"
                  : id === "#platforms"
                    ? "Platformy"
                    : id === "#pricing"
                      ? "Cennik"
                      : "FAQ"}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
              <AuthButtons />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
