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

  const AuthButtons = () => {
    if (session?.user) {
      return (
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="flex items-center gap-2 transition-all duration-200 hover:bg-gray-50 hover:scale-105"
            aria-label="Przejdź do panelu użytkownika"
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar użytkownika"
                width={24}
                height={24}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <User className="h-4 w-4" />
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
            className="transition-all duration-200 hover:bg-gray-50 hover:scale-105"
            aria-label="Zaloguj się"
          >
            Zaloguj się
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button
            className="transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-white/80 backdrop-blur-sm"
      } border-b border-gray-200`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
            aria-label="Strona główna"
          >
            Social Flow
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="#reviews"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              onClick={(e) => handleScroll(e, "#reviews")}
              aria-label="Przejdź do sekcji opinii"
            >
              Opinie
            </Link>
            <Link
              href="#platforms"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              onClick={(e) => handleScroll(e, "#platforms")}
              aria-label="Przejdź do sekcji platform"
            >
              Platformy
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              onClick={(e) => handleScroll(e, "#pricing")}
              aria-label="Przejdź do sekcji cennika"
            >
              Cennik
            </Link>
            <Link
              href="#faq"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              onClick={(e) => handleScroll(e, "#faq")}
              aria-label="Przejdź do sekcji FAQ"
            >
              FAQ
            </Link>
            <div className="flex items-center gap-4">
              <AuthButtons />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden border-t border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <Link
            href="#reviews"
            className="block text-gray-600 hover:text-gray-900 transition-colors duration-200"
            onClick={(e) => handleScroll(e, "#reviews")}
            aria-label="Przejdź do sekcji opinii"
          >
            Opinie
          </Link>
          <Link
            href="#platforms"
            className="block text-gray-600 hover:text-gray-900 transition-colors duration-200"
            onClick={(e) => handleScroll(e, "#platforms")}
            aria-label="Przejdź do sekcji platform"
          >
            Platformy
          </Link>
          <Link
            href="#pricing"
            className="block text-gray-600 hover:text-gray-900 transition-colors duration-200"
            onClick={(e) => handleScroll(e, "#pricing")}
            aria-label="Przejdź do sekcji cennika"
          >
            Cennik
          </Link>
          <Link
            href="#faq"
            className="block text-gray-600 hover:text-gray-900 transition-colors duration-200"
            onClick={(e) => handleScroll(e, "#faq")}
            aria-label="Przejdź do sekcji FAQ"
          >
            FAQ
          </Link>
          <div className="pt-4 flex flex-col gap-2">
            <AuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}
