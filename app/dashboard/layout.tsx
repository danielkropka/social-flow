"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PostCreationProvider } from "@/context/PostCreationContext";
import { useTab } from "@/context/TabContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Zap, BarChart3, Users, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SafeAccount } from "@/types";

const fetchAccounts = async (): Promise<SafeAccount[]> => {
  const response = await fetch("/api/accounts");
  if (!response.ok) {
    throw new Error("Błąd podczas pobierania kont");
  }
  return await response.json();
};

function EmptyState({ onAddAccount }: { onAddAccount: () => void }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectAccount = async () => {
    setIsConnecting(true);
    try {
      // Symulujemy krótkie opóźnienie dla lepszego UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAddAccount();
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <section
        className="w-full max-w-4xl rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-8 sm:p-10 lg:p-12 text-center shadow-xl shadow-gray-900/5"
        role="region"
        aria-labelledby="empty-state-title"
      >
        {/* Hero Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 mb-6">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2
            id="empty-state-title"
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
          >
            Rozpocznij swoją podróż z Social Flow
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Połącz swoje konta społecznościowe, aby planować i publikować posty
            bezpośrednio z panelu.
            <span className="block mt-2 text-sm text-gray-500">
              To zajmie mniej niż minutę
            </span>
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Co zyskujesz?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: "Planowanie postów",
                desc: "Twórz harmonogram i publikuj, gdy Twoi odbiorcy są najbardziej aktywni.",
                icon: Calendar,
                gradient: "from-emerald-500 to-teal-600",
                bgGradient: "from-emerald-50 to-teal-50",
                borderColor: "border-emerald-200",
              },
              {
                title: "Automatyczna publikacja",
                desc: "Wyślij posty bez ręcznej interwencji w wybranych kanałach.",
                icon: Zap,
                gradient: "from-blue-500 to-sky-600",
                bgGradient: "from-blue-50 to-sky-50",
                borderColor: "border-blue-200",
              },
              {
                title: "Podgląd i statystyki",
                desc: "Podgląd treści przed publikacją oraz proste metryki wyników.",
                icon: BarChart3,
                gradient: "from-violet-500 to-purple-600",
                bgGradient: "from-violet-50 to-purple-50",
                borderColor: "border-violet-200",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-gray-300 hover:bg-white hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.bgGradient} border ${benefit.borderColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <benefit.icon className={`w-6 h-6 text-gray-700`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <Button
            onClick={handleConnectAccount}
            disabled={isConnecting}
            autoFocus
            className="w-full sm:w-auto px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2 text-white" />
                Połącz pierwsze konto
              </>
            )}
          </Button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          W każdej chwili możesz dodać kolejne konta w sekcji „Połączone konta”.
        </p>
      </section>
    </div>
  );
}

const PostsContent = dynamic(() => import("@/components/PostsContent"));
const AccountsContent = dynamic(() => import("@/components/AccountsContent"));

interface DashboardLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  main?: ReactNode;
}

function DashboardShell({
  children,
  header,
  sidebar,
  main,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {header}
      <div className="flex flex-1 min-h-0">
        {sidebar}
        <main className="flex-1 flex flex-col items-stretch w-full max-w-full mx-auto px-2 md:px-6 py-8 gap-6">
          <div className="flex flex-col lg:flex-row gap-6 w-full flex-1">
            <section className="flex-[2] min-w-0 bg-white rounded-2xl shadow-lg p-6 flex flex-col min-h-[600px] border border-gray-100">
              {main || children}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeTab, setActiveTab } = useTab();
  
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    staleTime: 1000 * 60 * 5, // Dane są "świeże" przez 5 minut
    refetchInterval: 1000 * 60 * 5, // Automatyczne odświeżanie co 5 minut
  });
  
  const accountsCount = accounts.length;

  let mainContent: ReactNode = null;
  if (activeTab === "dashboard") {
    mainContent = (
      <>
        {isLoading ? (
          <div className="flex-1 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-24 w-full bg-gray-100 rounded-xl border border-gray-200" />
          </div>
        ) : accountsCount === 0 ? (
          <EmptyState onAddAccount={() => setActiveTab("accounts")} />
        ) : (
          children
        )}
      </>
    );
  } else if (activeTab === "posts") {
    mainContent = <PostsContent />;
  } else if (activeTab === "accounts") {
    mainContent = <AccountsContent />;
  } else {
    mainContent = children;
  }

  return (
    <DashboardShell
      header={<DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />}
      sidebar={
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onTabChange={setActiveTab}
          activeTab={activeTab}
        />
      }
      main={mainContent}
    >
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PostCreationProvider>
      <DashboardContent>{children}</DashboardContent>
    </PostCreationProvider>
  );
}
