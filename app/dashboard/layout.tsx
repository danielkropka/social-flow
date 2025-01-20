"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PostCreationProvider } from "@/context/PostCreationContext";
import PostsContent from "@/components/PostsContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return children;
      case "posts":
        return <PostsContent />;
      default:
        return children;
    }
  };

  return (
    <PostCreationProvider>
      <div className="min-h-screen">
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex">
          <Sidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            onTabChange={setActiveTab}
          />
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <Card className="max-w-6xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {activeTab === "posts" ? "Posty" : "Utwórz post"}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderContent()}</CardContent>
            </Card>
          </main>
        </div>
      </div>
    </PostCreationProvider>
  );
}
