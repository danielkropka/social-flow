"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PostCreationProvider } from "@/context/PostCreationContext";
import { useTab } from "@/context/TabContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

function EmptyState({ onAddAccount }: { onAddAccount: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <section
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm"
        role="region"
        aria-labelledby="empty-state-title"
      >
        <h2
          id="empty-state-title"
          className="text-xl font-semibold text-gray-900"
        >
          Brak połączonych kont
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Połącz konto, aby planować i publikować posty bezpośrednio z panelu.
          To zajmie mniej niż minutę.
        </p>

        {(() => {
          const benefits = [
            {
              title: "Planowanie postów",
              desc: "Twórz harmonogram i publikuj, gdy Twoi odbiorcy są najbardziej aktywni.",
              icon: (
                <svg
                  className="h-5 w-5 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h8M8 11h8M8 15h5"
                  />
                </svg>
              ),
              accent: "emerald",
            },
            {
              title: "Automatyczna publikacja",
              desc: "Wyślij posty bez ręcznej interwencji w wybranych kanałach.",
              icon: (
                <svg
                  className="h-5 w-5 text-sky-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 7-7v4h7v6h-7v4l-7-7z"
                  />
                </svg>
              ),
              accent: "sky",
            },
            {
              title: "Podgląd i statystyki",
              desc: "Podgląd treści przed publikacją oraz proste metryki wyników.",
              icon: (
                <svg
                  className="h-5 w-5 text-violet-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 19h16M6 17V7m6 10V5m6 12v-6"
                  />
                </svg>
              ),
              accent: "violet",
            },
          ] as const;

          const accentClasses: Record<string, { bg: string; ring: string }> = {
            emerald: { bg: "bg-emerald-50", ring: "ring-emerald-100" },
            sky: { bg: "bg-sky-50", ring: "ring-sky-100" },
            violet: { bg: "bg-violet-50", ring: "ring-violet-100" },
          };

          return (
            <ul
              className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
              role="list"
              aria-label="Korzyści z połączenia konta"
            >
              {benefits.map((b, i) => {
                const a = accentClasses[b.accent];
                return (
                  <li key={i} className="h-full">
                    <div
                      tabIndex={0}
                      className="group h-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition-all hover:border-gray-300 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${a.bg} ring-1 ${a.ring}`}
                        >
                          {b.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {b.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">
                            {b.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()}

        <div className="mt-8 flex items-center justify-center">
          <Button onClick={onAddAccount} autoFocus className="w-full sm:w-auto">
            Połącz konto
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
const ContentStudioContent = dynamic(
  () => import("@/components/ContentStudioContent"),
);

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
  const accounts = ["s"];
  const isLoading = false;
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
  } else if (activeTab === "content-studio") {
    mainContent = <ContentStudioContent />;
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
