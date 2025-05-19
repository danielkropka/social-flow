"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PostCreationProvider } from "@/context/PostCreationContext";
import { useTab } from "@/context/TabContext";
import PostsContent from "@/components/PostsContent";
import AccountsContent from "@/components/AccountsContent";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeTab, setActiveTab } = useTab();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return children;
      case "posts":
        return <PostsContent />;
      case "accounts":
        return <AccountsContent />;
      default:
        return children;
    }
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <div className="flex">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onTabChange={setActiveTab}
          activeTab={activeTab}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PostCreationProvider>
      <DashboardContent>{children}</DashboardContent>
    </PostCreationProvider>
  );
}
