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
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { TabContextType } from "@/context/TabContext";

// Dodatkowe: poprawa dostępności dla Enter/Space na elementach interaktywnych
const handleKeyActivate = (e: React.KeyboardEvent, cb: () => void) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    cb();
  }
};

const contentCreationItems = [
  { href: "dashboard", icon: PlusCircle, label: "Nowy post" },
  { href: "posts", icon: List, label: "Lista postów" },
];

const configurationItems = [
  { href: "accounts", icon: Share2, label: "Połączone konta" },
  {
    href: "content-studio",
    icon: BarChart2,
    label: "Studio treści",
    requiresCreator: true,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: TabContextType["setActiveTab"];
  activeTab: TabContextType["activeTab"];
}

export function Sidebar({
  isOpen,
  onClose,
  onTabChange,
  activeTab,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const { type, isSubscribed } = useSubscription();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleNavigation = (tab: TabContextType["activeTab"]) => {
    onTabChange(tab);
    onClose();
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      if (!session?.user?.stripeCustomerId)
        throw new Error("Nie udało się uzyskać ID klienta Stripe");

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      );

      if (!stripe) throw new Error("Wystąpił błąd podczas ładowania Stripe");

      setIsProfileOpen(false);

      const portal = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: session.user.stripeCustomerId,
        }),
      });

      if (!portal.ok)
        throw new Error("Nie udało się utworzyć sesji billing portal");

      const data = await portal.json();

      if (data.error) throw new Error(data.error);

      window.location.href = data.url;
    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error("Wystąpił błąd podczas tworzenia sesji billing portal");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Główna nawigacja"
        className={`
          fixed lg:sticky top-0 lg:top-0
          h-[100dvh] w-[280px]
          bg-gradient-to-b from-white to-blue-50/30 dark:from-zinc-950 dark:to-zinc-900
          shadow-xl lg:shadow-none
          flex flex-col
          transition-all duration-300 ease-in-out
          lg:translate-x-0 z-50
          border-r border-gray-200/70 dark:border-zinc-800
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-gray-100/70 dark:border-zinc-800/80">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm group-hover:scale-[1.03] transition-transform">
              S
            </span>
            <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text group-hover:opacity-90 transition-opacity">
              Social Flow
            </span>
          </Link>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200/60 dark:scrollbar-thumb-zinc-700/60">
          <div className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2 px-3">
              Tworzenie treści
            </h3>
            {contentCreationItems.map((item) => {
              const isActive = activeTab === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() =>
                    handleNavigation(item.href as TabContextType["activeTab"])
                  }
                  onKeyDown={(e) =>
                    handleKeyActivate(e, () =>
                      handleNavigation(
                        item.href as TabContextType["activeTab"],
                      ),
                    )
                  }
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    group relative flex w-full items-center gap-3 px-3 py-2.5 mb-1.5
                    rounded-xl transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                    ${
                      isActive
                        ? "text-blue-800 dark:text-blue-300"
                        : "text-gray-800 dark:text-zinc-200 hover:text-gray-950 dark:hover:text-white"
                    }
                  `}
                >
                  {/* Active background pill */}
                  <span
                    aria-hidden="true"
                    className={`
                      absolute inset-0 rounded-xl
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 ring-1 ring-blue-200/70 dark:ring-zinc-700 shadow-sm"
                          : "bg-transparent group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/60 ring-1 ring-transparent group-hover:ring-gray-200/70 dark:group-hover:ring-zinc-700/70"
                      }
                    `}
                  />
                  <item.icon
                    className={`
                      h-5 w-5 flex-shrink-0 relative z-10
                      ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white"}
                      transition-all duration-200 group-hover:scale-110
                    `}
                  />
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-gradient-to-b from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.45)]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2 px-3">
              Konfiguracja
            </h3>
            {configurationItems.map((item) => {
              if (item.requiresCreator && type !== "CREATOR") {
                return null;
              }

              const isActive = activeTab === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() =>
                    handleNavigation(item.href as TabContextType["activeTab"])
                  }
                  onKeyDown={(e) =>
                    handleKeyActivate(e, () =>
                      handleNavigation(
                        item.href as TabContextType["activeTab"],
                      ),
                    )
                  }
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    group relative flex w-full items-center gap-3 px-3 py-2.5 mb-1.5
                    rounded-xl transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                    ${
                      isActive
                        ? "text-blue-800 dark:text-blue-300"
                        : "text-gray-800 dark:text-zinc-200 hover:text-gray-950 dark:hover:text-white"
                    }
                  `}
                >
                  <span
                    aria-hidden="true"
                    className={`
                      absolute inset-0 rounded-xl
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 ring-1 ring-blue-200/70 dark:ring-zinc-700 shadow-sm"
                          : "bg-transparent group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/60 ring-1 ring-transparent group-hover:ring-gray-200/70 dark:group-hover:ring-zinc-700/70"
                      }
                    `}
                  />
                  <item.icon
                    className={`
                      h-5 w-5 flex-shrink-0 relative z-10
                      ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white"}
                      transition-all duration-200 group-hover:scale-110
                    `}
                  />
                  <span className="font-medium text-sm relative z-10">
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-gradient-to-b from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.45)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User profile */}
        <div
          className="relative px-3 py-4 border-t border-gray-100/70 dark:border-zinc-800/80 bg-gray-50/60 dark:bg-zinc-900/60 backdrop-blur-sm"
          ref={profileRef}
        >
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onKeyDown={(e) =>
              handleKeyActivate(e, () => setIsProfileOpen(!isProfileOpen))
            }
            aria-expanded={isProfileOpen}
            aria-controls="profile-dropdown"
            className="w-full px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800/70 hover:shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
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
                <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-zinc-800 shadow-sm">
                  {session?.user?.image ? (
                    <AvatarImage
                      src={session.user.image}
                      alt={session?.user?.name ?? ""}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {session?.user?.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate w-full">
                    {session?.user?.name ?? "Użytkownik"}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-zinc-400 truncate w-full">
                    {session?.user?.subscriptionType === "BASIC"
                      ? "Plan Podstawowy"
                      : session?.user?.subscriptionType === "CREATOR"
                        ? "Plan Twórca"
                        : "Plan darmowy"}
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 dark:text-zinc-400 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {/* Profile dropdown */}
          <div
            id="profile-dropdown"
            className={`
              absolute bottom-full left-0 right-0 m-3 
              bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100/80 dark:border-zinc-800 overflow-hidden
              transform transition-all duration-200 ease-in-out origin-bottom
              ${isProfileOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98] pointer-events-none"}
            `}
          >
            <Link
              href="/#pricing"
              className="w-full px-4 py-3 flex justify-between items-center gap-3 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">Plany</span>
              <Layout className="h-4 w-4" />
            </Link>
            {isSubscribed && (
              <div
                className="w-full px-4 py-3 flex justify-between items-center gap-3 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors hover:cursor-pointer"
                onClick={handleManageSubscription}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  handleKeyActivate(e, handleManageSubscription)
                }
              >
                <span className="text-sm font-medium">
                  Zarządzaj subskrypcją
                </span>
                <ExternalLink className="h-4 w-4" />
              </div>
            )}
            <button
              onClick={() => signOut()}
              onKeyDown={(e) => handleKeyActivate(e, () => signOut())}
              className="w-full px-4 py-3 flex justify-between items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:text-red-400 transition-colors focus:outline-none"
            >
              <span className="text-sm font-medium">Wyloguj się</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
        </div>
      )}
    </>
  );
}
