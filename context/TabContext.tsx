"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type TabContextType = {
  activeTab: "dashboard" | "accounts" | "posts" | "content-studio";
  setActiveTab: (tab: TabContextType["activeTab"]) => void;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] =
    useState<TabContextType["activeTab"]>("dashboard");

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTab must be used within a TabProvider");
  }
  return context;
}
