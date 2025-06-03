"use client";

import { useState, ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PostCreationProvider } from "@/context/PostCreationContext";
import { useTab } from "@/context/TabContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAccounts } from "@/components/posts/hooks/useAccounts";
import dynamic from "next/dynamic";

const PostsContent = dynamic(() => import("@/components/PostsContent"));
const AccountsContent = dynamic(() => import("@/components/AccountsContent"));
const ContentStudioContent = dynamic(
  () => import("@/components/ContentStudioContent")
);

function NoAccountsAlert() {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 shadow text-red-800">
      <svg
        className="w-6 h-6 text-red-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0ZM12 17h.01M12 7h.01"
        />
      </svg>
      <span>
        Nie masz jeszcze żadnych połączonych kont.{" "}
        <a href="#" className="underline font-semibold">
          Dodaj konto
        </a>
        , aby móc publikować!
      </span>
    </div>
  );
}

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
  const { accounts, isLoading } = useAccounts();
  const accountsCount = accounts.length;

  let mainContent: ReactNode = null;
  if (activeTab === "dashboard") {
    mainContent = (
      <>
        {accountsCount === 0 && !isLoading && <NoAccountsAlert />}
        {children}
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
