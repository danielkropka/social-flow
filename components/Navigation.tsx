"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, X, User } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

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
          <Button variant="outline" className="flex items-center gap-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
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
          <Button variant="outline">Zaloguj się</Button>
        </Link>
        <Link href="/sign-up">
          <Button>Rozpocznij za darmo</Button>
        </Link>
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text"
          >
            Social Flow
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="#reviews"
              className="text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#reviews")}
            >
              Opinie
            </Link>
            <Link
              href="#platforms"
              className="text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#platforms")}
            >
              Platformy
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#pricing")}
            >
              Cennik
            </Link>
            <Link
              href="#faq"
              className="text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#faq")}
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
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
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
      {isOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <Link
              href="#reviews"
              className="block text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#reviews")}
            >
              Opinie
            </Link>
            <Link
              href="#platforms"
              className="block text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#platforms")}
            >
              Platformy
            </Link>
            <Link
              href="#pricing"
              className="block text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#pricing")}
            >
              Cennik
            </Link>
            <Link
              href="#faq"
              className="block text-gray-600 hover:text-gray-900"
              onClick={(e) => handleScroll(e, "#faq")}
            >
              FAQ
            </Link>
            <div className="pt-4 flex flex-col gap-2">
              <AuthButtons />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
