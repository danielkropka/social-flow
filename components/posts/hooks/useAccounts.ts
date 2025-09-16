import { useState, useEffect } from "react";
import type { SocialAccountWithUsername } from "@/types";

export function useAccounts() {
  const [accounts, setAccounts] = useState<SocialAccountWithUsername[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Nie udało się pobrać połączonych kont");
      }
      const data = await response.json();
      setAccounts(
        (Array.isArray(data) ? data : data.accounts || []).map(
          (acc: SocialAccountWithUsername) => ({
            ...acc,
            provider: acc.provider ?? acc.platform ?? "",
            username: acc.username ?? "",
            providerAccountId: acc.providerAccountId ?? "",
            platform: acc.platform ?? acc.provider ?? "",
            name: acc.name ?? "",
            avatar: acc.avatar ?? "",
            accountType: acc.accountType ?? "",
            id: acc.id,
          })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = (accounts || []).filter(
    (account) =>
      (account.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.provider.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedPlatforms.length === 0 ||
        selectedPlatforms.includes(account.provider.toLowerCase()))
  );

  const groupedAccounts = filteredAccounts.reduce(
    (acc, account) => {
      const platform = account.provider.toLowerCase();
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(account);
      return acc;
    },
    {} as Record<string, SocialAccountWithUsername[]>
  );

  return {
    accounts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPlatforms,
    setSelectedPlatforms,
    filteredAccounts,
    groupedAccounts,
    refetchAccounts: fetchAccounts,
  };
}
