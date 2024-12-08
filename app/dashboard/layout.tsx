"use client";

import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PostCreationProvider } from "@/context/PostCreationContext";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <PostCreationProvider>
      <div className="min-h-screen">
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex">
          <Sidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </PostCreationProvider>
  );
}
