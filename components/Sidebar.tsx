"use client";

import Link from "next/link";
import {
  PlusCircle,
  List,
  Share2,
  LogOut,
  ChevronDown,
  Layout,
  BarChart2,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

const contentCreationItems = [
  { href: "dashboard", icon: PlusCircle, label: "Nowy post" },
  { href: "posts", icon: List, label: "Lista postów" },
];

const configurationItems = [
  { href: "accounts", icon: Share2, label: "Połączone konta" },
  { href: "content-studio", icon: BarChart2, label: "Studio treści" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export function Sidebar({
  isOpen,
  onClose,
  onTabChange,
  activeTab,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigation = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-0
          h-[100dvh] w-[280px]
          bg-white shadow-xl lg:shadow-none
          flex flex-col
          transition-all duration-300 ease-in-out
          lg:translate-x-0 z-50
          border-r border-gray-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <Link
            href="/"
            className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-transparent bg-clip-text hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            Social Flow
          </Link>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 px-3 py-4 border-b border-gray-100 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 px-3">
              Tworzenie treści
            </h3>
            {contentCreationItems.map((item) => {
              const isActive = activeTab === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    group flex w-full items-center gap-3 px-3 py-2.5 mb-1.5
                    rounded-xl transition-all duration-200 relative
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                    }
                  `}
                >
                  <item.icon
                    className={`
                    h-5 w-5 flex-shrink-0 relative z-10
                    ${
                      isActive
                        ? "text-blue-700"
                        : "text-gray-600 group-hover:text-gray-900"
                    }
                    transition-all duration-200
                    group-hover:scale-110
                  `}
                  />
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 px-3">
              Konfiguracja
            </h3>
            {configurationItems.map((item) => {
              const isActive = activeTab === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    group flex w-full items-center gap-3 px-3 py-2.5 mb-1.5
                    rounded-xl transition-all duration-200 relative
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                    }
                  `}
                >
                  <item.icon
                    className={`
                    h-5 w-5 flex-shrink-0 relative z-10
                    ${
                      isActive
                        ? "text-blue-700"
                        : "text-gray-600 group-hover:text-gray-900"
                    }
                    transition-all duration-200
                    group-hover:scale-110
                  `}
                  />
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User profile */}
        <div
          className="relative px-3 py-4 border-t border-gray-100 bg-gray-50/50"
          ref={profileRef}
        >
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200"
          >
            {status === "loading" ? (
              <>
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 flex flex-col items-start gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-5" />
              </>
            ) : (
              <>
                <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                  {session?.user?.image ? (
                    <AvatarImage
                      src={session.user.image}
                      alt={session?.user?.name ?? ""}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {session?.user?.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate w-full">
                    {session?.user?.name ?? "Użytkownik"}
                  </span>
                  <span className="text-xs text-gray-600 truncate w-full">
                    {session?.user?.subscriptionType === "BASIC"
                      ? "Plan Podstawowy"
                      : session?.user?.subscriptionType === "CREATOR"
                      ? "Plan Twórca"
                      : "Plan darmowy"}
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {/* Profile dropdown */}
          <div
            className={`
              absolute bottom-full left-0 right-0 m-3 
              bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden
              transform transition-all duration-200 ease-in-out
              ${
                isProfileOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }
            `}
          >
            <Link
              href="/#pricing"
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Layout className="h-4 w-4" />
              <span className="text-sm font-medium">Plany</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Wyloguj się</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
