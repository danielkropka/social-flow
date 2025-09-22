import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Loader2, Search, Filter, CheckSquare, Square, RefreshCw, SortAsc, SortDesc, Users } from "lucide-react";
import { SiTiktok, SiFacebook, SiX, SiInstagram } from "react-icons/si";
import { usePostCreation } from "@/context/PostCreationContext";
import { PublicSocialAccount } from "@/types";

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  TWITTER:
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900",
  FACEBOOK:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
  INSTAGRAM:
    "bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-900",
  TIKTOK:
    "bg-neutral-900 text-white border-neutral-800 dark:bg-neutral-900 dark:text-white dark:border-neutral-800",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  TWITTER: <SiX className="h-3.5 w-3.5" />,
  FACEBOOK: <SiFacebook className="h-3.5 w-3.5" />,
  INSTAGRAM: <SiInstagram className="h-3.5 w-3.5" />,
  TIKTOK: <SiTiktok className="h-3.5 w-3.5" />,
};

const PLATFORM_NAMES: Record<string, string> = {
  TWITTER: "Twitter (X)",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

export default function AccountSelection() {
  const { selectedAccounts, setSelectedAccounts, setCurrentStep } = usePostCreation();
  const [accounts, setAccounts] = useState<PublicSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "platform" | "connectedAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAccountToggle = (account: PublicSocialAccount) => {
    const isSelected = selectedAccounts.some(
      (selected) => selected.id === account.id
    );

    if (isSelected) {
      setSelectedAccounts(
        selectedAccounts.filter((selected) => selected.id !== account.id)
      );
    } else {
      setSelectedAccounts([...selectedAccounts, account]);
    }
  };

  const handleContinue = () => {
    if (selectedAccounts.length > 0) {
      setCurrentStep(3); // Assuming next step is 3
    }
  };

  // Get available platforms from accounts
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(accounts.map(account => account.provider));
    return Array.from(platforms);
  }, [accounts]);

  // Filter and sort accounts
  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = accounts.filter(account => {
      // Search filter
      const searchMatch = searchQuery === "" || 
        (account.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         account.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         PLATFORM_NAMES[account.provider]?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Platform filter
      const platformMatch = selectedPlatforms.length === 0 || 
        selectedPlatforms.includes(account.provider);

      return searchMatch && platformMatch;
    });

    // Sort accounts
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          const nameA = (a.displayName || a.username || "").toLowerCase();
          const nameB = (b.displayName || b.username || "").toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "platform":
          comparison = PLATFORM_NAMES[a.provider]?.localeCompare(PLATFORM_NAMES[b.provider] || "") || 0;
          break;
        case "connectedAt":
          const dateA = new Date(a.connectedAt).getTime();
          const dateB = new Date(b.connectedAt).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [accounts, searchQuery, selectedPlatforms, sortBy, sortOrder]);

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedPlatforms([]);
  };

  const handleSelectAll = () => {
    setSelectedAccounts(filteredAndSortedAccounts);
  };

  const handleSelectNone = () => {
    setSelectedAccounts([]);
  };

  const handleSelectByPlatform = (platform: string) => {
    const platformAccounts = filteredAndSortedAccounts.filter(account => account.provider === platform);
    const currentPlatformSelected = selectedAccounts.filter(account => account.provider === platform);
    
    if (currentPlatformSelected.length === platformAccounts.length) {
      // Deselect all from this platform
      setSelectedAccounts(selectedAccounts.filter(account => account.provider !== platform));
    } else {
      // Select all from this platform
      const otherSelected = selectedAccounts.filter(account => account.provider !== platform);
      setSelectedAccounts([...otherSelected, ...platformAccounts]);
    }
  };

  const toggleSort = (newSortBy: "name" | "platform" | "connectedAt") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <section className="w-full">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Wybierz konta
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Wybierz konta społecznościowe, na których chcesz opublikować post.
          </p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <span className="text-sm text-gray-500">Ładowanie kont...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Wybierz konta
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Wybierz konta społecznościowe, na których chcesz opublikować post.
          </p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Błąd podczas ładowania kont
            </p>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (accounts.length === 0) {
    return (
      <section className="w-full">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Wybierz konta
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Wybierz konta społecznościowe, na których chcesz opublikować post.
          </p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Brak połączonych kont
            </p>
            <p className="text-xs text-gray-400">
              Połącz swoje konta społecznościowe, aby móc publikować posty.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Wybierz konta
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Wybierz konta społecznościowe, na których chcesz opublikować post.
          Możesz wybrać wiele kont jednocześnie.
        </p>
      </header>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Input and Actions */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Szukaj kont po nazwie lub platformie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={fetchAccounts}
              disabled={refreshing}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Odśwież
            </button>
          </div>
        </div>

        {/* Bulk Actions and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Bulk Selection */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Zaznacz wszystkie
              </button>
              <button
                onClick={handleSelectNone}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Square className="h-3.5 w-3.5" />
                Odznacz wszystkie
              </button>
            </div>

            {/* Platform Quick Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Szybki wybór:</span>
              {availablePlatforms.map((platform) => {
                const platformName = PLATFORM_NAMES[platform] || platform;
                const platformIcon = PLATFORM_ICONS[platform];
                const platformAccounts = filteredAndSortedAccounts.filter(account => account.provider === platform);
                const selectedCount = selectedAccounts.filter(account => account.provider === platform).length;
                const isAllSelected = platformAccounts.length > 0 && selectedCount === platformAccounts.length;

                return (
                  <button
                    key={platform}
                    onClick={() => handleSelectByPlatform(platform)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                      isAllSelected
                        ? "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950/40 dark:text-green-200"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                    ].join(" ")}
                    title={`${isAllSelected ? 'Odznacz' : 'Zaznacz'} wszystkie konta ${platformName}`}
                  >
                    {platformIcon}
                    {platformName}
                    {platformAccounts.length > 0 && (
                      <span className="text-xs">({selectedCount}/{platformAccounts.length})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sortuj:</span>
            <div className="flex gap-1">
              {[
                { key: "name" as const, label: "Nazwa" },
                { key: "platform" as const, label: "Platforma" },
                { key: "connectedAt" as const, label: "Data" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={[
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                    sortBy === key
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                      : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
                  ].join(" ")}
                >
                  {label}
                  {sortBy === key && (
                    sortOrder === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtruj platformy:
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform);
              const platformName = PLATFORM_NAMES[platform] || platform;
              const platformIcon = PLATFORM_ICONS[platform];
              const platformStyle = PLATFORM_BADGE_STYLES[platform];

              return (
                <button
                  key={platform}
                  onClick={() => handlePlatformToggle(platform)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                      : platformStyle ??
                        "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700",
                  ].join(" ")}
                >
                  {platformIcon}
                  {platformName}
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>

          {(searchQuery || selectedPlatforms.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Wyczyść filtry
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {filteredAndSortedAccounts.length === accounts.length ? (
              `Wyświetlane wszystkie konta (${accounts.length})`
            ) : (
              `Wyświetlane ${filteredAndSortedAccounts.length} z ${accounts.length} kont`
            )}
          </div>
          
          {selectedAccounts.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <Users className="h-3.5 w-3.5" />
              Wybrano {selectedAccounts.length} {selectedAccounts.length === 1 ? "konto" : "kont"}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedAccounts.map((account) => {
          const isSelected = selectedAccounts.some(
            (selected) => selected.id === account.id
          );
          const platformName = PLATFORM_NAMES[account.provider] || account.provider;
          const platformIcon = PLATFORM_ICONS[account.provider];
          const platformStyle = PLATFORM_BADGE_STYLES[account.provider];

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => handleAccountToggle(account)}
              className={[
                "group relative text-left focus:outline-none",
                "transition-transform duration-150 ease-out hover:-translate-y-0.5",
              ].join(" ")}
            >
              <Card
                className={[
                  "relative overflow-hidden border transition-colors",
                  "bg-white/70 dark:bg-zinc-900/60 backdrop-blur",
                  isSelected
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                    : "hover:border-zinc-300 dark:hover:border-zinc-700",
                ].join(" ")}
              >
                <div
                  aria-hidden
                  className={[
                    "pointer-events-none absolute inset-x-0 -top-16 h-32",
                    "bg-gradient-to-b",
                    isSelected
                      ? "from-blue-500/15 via-blue-500/10 to-transparent"
                      : "from-zinc-500/10 via-zinc-500/5 to-transparent",
                  ].join(" ")}
                />

                <CardHeader className="relative">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                            "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                            "shadow-sm",
                          ].join(" ")}
                        >
                          {platformIcon}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {account.displayName || account.username || platformName}
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                          {account.username && account.displayName
                            ? `@${account.username}`
                            : platformName}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                          platformStyle ??
                            "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                        ].join(" ")}
                      >
                        {platformIcon}
                        {platformName}
                      </span>
                    </div>
                  </div>

                  {account.status === "ACTIVE" && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ Konto aktywne
                    </p>
                  )}
                  {account.status === "EXPIRED" && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ⚠ Token wygasł
                    </p>
                  )}
                  {account.status === "REVOKED" && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ✗ Dostęp odwołany
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {account.connectedAt && (
                        <p>
                          Połączono: {new Date(account.connectedAt).toLocaleDateString("pl-PL")}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        Wybrane
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* No results message */}
      {filteredAndSortedAccounts.length === 0 && accounts.length > 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Brak kont spełniających kryteria wyszukiwania
            </p>
            <p className="text-xs text-gray-400">
              Spróbuj zmienić filtry lub wyszukiwanie
            </p>
          </div>
        </div>
      )}

      {selectedAccounts.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Wybrano {selectedAccounts.length} {selectedAccounts.length === 1 ? "konto" : "kont"}
          </div>
          <button
            onClick={handleContinue}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "bg-blue-600 text-white shadow-sm transition-colors",
              "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "dark:focus:ring-offset-zinc-900",
            ].join(" ")}
          >
            Kontynuuj
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}