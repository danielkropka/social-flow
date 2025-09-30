"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type TabContextType = {
  activeTab: "dashboard" | "accounts" | "posts" | "content-studio";
  setActiveTab: (tab: TabContextType["activeTab"]) => void;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

const VALID_TABS: TabContextType["activeTab"][] = ["dashboard", "accounts", "posts", "content-studio"];

export function TabProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Pobierz aktualną zakładkę z URL lub użyj domyślnej
  const tabFromUrl = searchParams.get("tab");
  const activeTab: TabContextType["activeTab"] = 
    tabFromUrl && VALID_TABS.includes(tabFromUrl as TabContextType["activeTab"])
      ? (tabFromUrl as TabContextType["activeTab"])
      : "dashboard";

  const setActiveTab = (tab: TabContextType["activeTab"]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

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