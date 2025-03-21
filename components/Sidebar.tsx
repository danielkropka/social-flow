"use client";

import Link from "next/link";
import {
  PlusCircle,
  List,
  Share2,
  LogOut,
  ChevronDown,
  Clock,
  Menu,
  Layout,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const contentCreationItems = [
  { href: "dashboard", icon: PlusCircle, label: "Nowy post" },
  { href: "posts", icon: List, label: "Lista postów" },
];

const configurationItems = [
  { href: "accounts", icon: Share2, label: "Połączone konta" },
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
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-white border-b border-gray-100 z-30">
        <span className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text">
          Social Flow
        </span>
        <button
          onClick={() => onClose()}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-0
          h-[100dvh] w-[280px]
          bg-white shadow-xl lg:shadow-none
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 z-50
          border-r border-gray-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo - visible only on desktop */}
        <div className="hidden lg:flex h-16 px-6 items-center border-b border-gray-100">
          <span className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-transparent bg-clip-text">
            Social Flow
          </span>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 px-3 py-4 border-b border-gray-100">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
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
                    rounded-xl transition-all relative
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon
                    className={`
                    h-5 w-5 flex-shrink-0 relative z-10
                    ${isActive ? "text-blue-600" : "text-gray-600"}
                    transition-transform duration-200
                  `}
                  />
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
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
                    rounded-xl transition-all relative
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon
                    className={`
                    h-5 w-5 flex-shrink-0 relative z-10
                      ${isActive ? "text-blue-600" : "text-gray-600"}
                    transition-transform duration-200
                  `}
                  />
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User profile */}
        <div className="relative px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-all"
          >
            <Avatar className="h-9 w-9 ring-2 ring-white">
              <AvatarImage
                src={session?.user?.image ?? ""}
                alt={session?.user?.name ?? ""}
              />
              <AvatarFallback>
                {session?.user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate w-full">
                {session?.user?.name ?? "Użytkownik"}
              </span>
              <span className="text-xs text-gray-500 truncate w-full">
                {session?.user?.subscriptionType === "BASIC"
                  ? "Plan Podstawowy"
                  : session?.user?.subscriptionType === "CREATOR"
                  ? "Plan Twórca"
                  : "Plan darmowy"}
              </span>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile dropdown */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-0 right-0 m-3 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <Link
                href="/#pricing"
                className="w-full px-4 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Layout className="h-4 w-4" />
                <span className="text-sm font-medium">Plany</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Wyloguj się</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
