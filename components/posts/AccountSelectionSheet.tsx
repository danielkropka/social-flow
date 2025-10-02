"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowRight,
  Loader2,
  Search,
  CheckSquare,
  Square,
  Users,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { SiTiktok, SiFacebook, SiX, SiInstagram } from "react-icons/si";
import { usePostCreation } from "@/context/PostCreationContext";
import { PublicSocialAccount } from "@/types";

// Motion/visual utils aligned with TypeSelectionSheet
const hoverTilt =
  "transition-transform duration-200 ease-out group-hover:-translate-y-0.5 active:group-active:translate-y-0";
const shineOverlay =
  "before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(600px_200px_at_var(--x,50%)_-20%,rgba(255,255,255,0.25),transparent_60%)] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300";
const gradientRing =
  "ring-1 ring-transparent group-hover:ring-zinc-200/70 dark:group-hover:ring-zinc-700/60";
const glassPanel =
  "bg-white/70 dark:bg-zinc-900/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur";

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

interface AccountSelectionSheetProps {
  onClose: () => void;
}

export default function AccountSelectionSheet({
  onClose,
}: AccountSelectionSheetProps) {
  const { selectedAccounts, setSelectedAccounts, setCurrentStep } =
    usePostCreation();
  const [accounts, setAccounts] = useState<PublicSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
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
    if (account.status === "EXPIRED" || account.status === "REVOKED") return;

    const isSelected = selectedAccounts.some((s) => s.id === account.id);
    setSelectedAccounts(
      isSelected
        ? selectedAccounts.filter((s) => s.id !== account.id)
        : [...selectedAccounts, account],
    );
  };

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter((a) => selectedPlatforms.includes(a.provider));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.displayName || "").toLowerCase().includes(q) ||
          (a.username || "").toLowerCase().includes(q),
      );
    }

    // sort by name asc to keep UI predictable
    filtered = [...filtered].sort((a, b) =>
      (a.displayName || a.username || "")
        .toLowerCase()
        .localeCompare((b.displayName || b.username || "").toLowerCase()),
    );

    return filtered;
  }, [accounts, selectedPlatforms, searchQuery]);

  const availablePlatforms = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.provider))).sort(),
    [accounts],
  );

  const handleSelectAll = () => {
    const available = filteredAccounts.filter(
      (a) => a.status !== "EXPIRED" && a.status !== "REVOKED",
    );
    if (
      selectedAccounts.length === available.length &&
      available.every((a) => selectedAccounts.some((s) => s.id === a.id))
    ) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(available);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleContinue = () => {
    if (selectedAccounts.length > 0) setCurrentStep(3);
  };

  const handleBack = () => setCurrentStep(1);

  return (
    <div className="space-y-6">
      {/* Header with playful accent */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100/40 to-transparent dark:via-zinc-800/30 pointer-events-none" />
        <div className="relative flex items-start gap-3 justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-inset ring-blue-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-sm sm:text-base">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Wybierz konta do publikacji
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300/90">
                Możesz wybrać wiele kont. Konta z wygasłym dostępem są
                wyłączone.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Wstecz
            </Button>
            <Button
              onClick={handleContinue}
              disabled={selectedAccounts.length === 0}
              className="flex items-center gap-2"
            >
              Kontynuuj
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controls card */}
      <div
        className={`relative overflow-hidden border ${glassPanel} rounded-2xl ${shineOverlay} ${gradientRing} p-4 sm:p-5`}
      >
        {/* Animated top hairline */}
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              placeholder="Szukaj kont (nazwa lub @nazwa)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Szukaj kont"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((platform) => (
              <button
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedPlatforms.includes(platform)
                    ? PLATFORM_BADGE_STYLES[platform]
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                }`}
                aria-pressed={selectedPlatforms.includes(platform)}
              >
                {PLATFORM_ICONS[platform]}
                {PLATFORM_NAMES[platform] || platform}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {selectedAccounts.length ===
              filteredAccounts.filter(
                (a) => a.status !== "EXPIRED" && a.status !== "REVOKED",
              ).length ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Zaznacz wszystkie dostępne
            </button>

            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <button
                onClick={fetchAccounts}
                disabled={refreshing}
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                title="Odśwież listę kont"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Odśwież
              </button>
              <span className="text-zinc-500 dark:text-zinc-400">
                {selectedAccounts.length} wybranych
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts grid */}
      <div className="max-h-96 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAccounts}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Spróbuj ponownie
            </Button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-10">
            <Users className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-600 dark:text-zinc-400">
              {searchQuery || selectedPlatforms.length > 0
                ? "Nie znaleziono kont spełniających kryteria"
                : "Brak połączonych kont"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAccounts.map((account) => {
              const isSelected = selectedAccounts.some(
                (s) => s.id === account.id,
              );
              const isBlocked =
                account.status === "EXPIRED" || account.status === "REVOKED";
              const platformName =
                PLATFORM_NAMES[account.provider] || account.provider;
              const platformIcon = PLATFORM_ICONS[account.provider];
              const platformStyle = PLATFORM_BADGE_STYLES[account.provider];

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleAccountToggle(account)}
                  disabled={isBlocked}
                  className={[
                    "group relative text-left focus:outline-none rounded-2xl",
                    isBlocked ? "cursor-not-allowed opacity-60" : hoverTilt,
                  ].join(" ")}
                  aria-pressed={isSelected}
                  aria-disabled={isBlocked}
                >
                  <Card
                    className={[
                      "relative overflow-hidden border rounded-2xl transition-colors",
                      glassPanel,
                      shineOverlay,
                      gradientRing,
                      isBlocked
                        ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20"
                        : isSelected
                          ? "border-blue-500/60 dark:border-blue-400/70"
                          : "hover:border-zinc-300 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    <div
                      aria-hidden
                      className={[
                        "pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b",
                        isBlocked
                          ? "from-red-500/15 via-red-500/10 to-transparent"
                          : isSelected
                            ? "from-blue-500/15 via-blue-500/10 to-transparent"
                            : "from-zinc-500/10 via-zinc-500/5 to-transparent",
                      ].join(" ")}
                    />

                    <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />

                    <CardHeader className="relative p-5 sm:p-6 pb-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60 shadow-sm">
                              {platformIcon}
                            </div>
                            {isSelected && !isBlocked && (
                              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            <span className="pointer-events-none absolute -inset-0.5 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/25 to-transparent dark:via-white/10" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base leading-tight truncate">
                              {account.displayName ||
                                account.username ||
                                platformName}
                            </CardTitle>
                            <CardDescription className="mt-0.5 text-xs truncate">
                              {account.username && account.displayName
                                ? `@${account.username}`
                                : platformName}
                            </CardDescription>
                          </div>
                        </div>

                        <span
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                            platformStyle ??
                              "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                          ].join(" ")}
                          title={platformName}
                        >
                          {platformIcon}
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {platformName}
                          </span>
                        </span>
                      </div>

                      {account.status === "ACTIVE" && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Konto aktywne
                        </p>
                      )}
                      {account.status === "EXPIRED" && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          ⚠ Token wygasł – połącz ponownie w Połączone konta
                        </p>
                      )}
                      {account.status === "REVOKED" && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          ✗ Dostęp odwołany – połącz ponownie w Połączone konta
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6 pt-0">
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <div>
                          {account.connectedAt && (
                            <p>
                              Połączono:{" "}
                              {new Date(account.connectedAt).toLocaleDateString(
                                "pl-PL",
                              )}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-blue-600 dark:text-blue-400">
                            Wybrane
                          </span>
                        )}
                      </div>
                    </CardContent>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/5 to-transparent dark:from-white/5" />
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline underline-offset-2"
        >
          Zamknij
        </button>
        <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
          Wybrano {selectedAccounts.filter((a) => a.status === "ACTIVE").length}{" "}
          kont(a)
          {selectedAccounts.filter((a) => a.status !== "ACTIVE").length > 0 && (
            <span className="ml-2 text-orange-600 dark:text-orange-400">
              ({selectedAccounts.filter((a) => a.status !== "ACTIVE").length}{" "}
              zablokowanych)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
