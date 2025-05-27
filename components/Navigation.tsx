"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const AuthButtons = () => {
    if (session?.user) {
      return (
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="flex items-center gap-2 transition-all duration-200 hover:bg-gray-50 hover:scale-105 active:scale-95 rounded-full px-4 py-2 shadow-sm text-base font-semibold"
            aria-label="Przejdź do panelu użytkownika"
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar użytkownika"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border border-gray-200 shadow"
              />
            ) : (
              <span className="h-7 w-7 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-base border border-gray-200 shadow">
                {getInitials(session.user.name ?? "")}
              </span>
            )}
            <span>{session.user.name || "Użytkownik"}</span>
          </Button>
        </Link>
      );
    }

    return (
      <>
        <Link href="/sign-in">
          <Button
            variant="outline"
            className="transition-all duration-200 hover:bg-gray-50 hover:scale-105 active:scale-95 rounded-full px-4 py-2 shadow-sm text-base font-semibold"
            aria-label="Zaloguj się"
          >
            Zaloguj się
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button
            className="transition-all duration-200 hover:scale-105 active:scale-95 rounded-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow text-base font-semibold text-white"
            aria-label="Rozpocznij za darmo"
          >
            Rozpocznij za darmo
          </Button>
        </Link>
      </>
    );
  };

  return (
    <nav
      className={`font-sans fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-sm ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-white/80 backdrop-blur-sm"
      } border-b border-gray-200`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text transition-all duration-200 hover:from-blue-600 hover:to-blue-700 tracking-tight drop-shadow-sm"
            aria-label="Strona główna"
          >
            Social Flow
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-12">
            <Link
              href="#reviews"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 text-lg font-medium px-2"
              onClick={(e) => handleScroll(e, "#reviews")}
              aria-label="Przejdź do sekcji opinii"
            >
              Opinie
            </Link>
            <Link
              href="#platforms"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 text-lg font-medium px-2"
              onClick={(e) => handleScroll(e, "#platforms")}
              aria-label="Przejdź do sekcji platform"
            >
              Platformy
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 text-lg font-medium px-2"
              onClick={(e) => handleScroll(e, "#pricing")}
              aria-label="Przejdź do sekcji cennika"
            >
              Cennik
            </Link>
            <Link
              href="#faq"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200 relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 text-lg font-medium px-2"
              onClick={(e) => handleScroll(e, "#faq")}
              aria-label="Przejdź do sekcji FAQ"
            >
              FAQ
            </Link>
            <div className="flex items-center gap-6">
              <AuthButtons />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-3 rounded-xl hover:bg-gray-100 transition-colors duration-200 active:scale-95 shadow-sm"
            aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-7 w-7 text-gray-600" />
            ) : (
              <Menu className="h-7 w-7 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden border-t border-gray-200 bg-white transition-all duration-500 ease-in-out rounded-b-2xl shadow-md ${
          isOpen
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Link
            href="#reviews"
            className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-lg font-medium relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 py-2"
            onClick={(e) => handleScroll(e, "#reviews")}
            aria-label="Przejdź do sekcji opinii"
          >
            Opinie
          </Link>
          <Link
            href="#platforms"
            className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-lg font-medium relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 py-2"
            onClick={(e) => handleScroll(e, "#platforms")}
            aria-label="Przejdź do sekcji platform"
          >
            Platformy
          </Link>
          <Link
            href="#pricing"
            className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-lg font-medium relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 py-2"
            onClick={(e) => handleScroll(e, "#pricing")}
            aria-label="Przejdź do sekcji cennika"
          >
            Cennik
          </Link>
          <Link
            href="#faq"
            className="block text-gray-600 hover:text-blue-600 transition-colors duration-200 text-lg font-medium relative after:content-[''] after:block after:w-0 after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full after:absolute after:left-0 after:-bottom-1 py-2"
            onClick={(e) => handleScroll(e, "#faq")}
            aria-label="Przejdź do sekcji FAQ"
          >
            FAQ
          </Link>
          <div className="pt-4 flex flex-col gap-3">
            <AuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}
