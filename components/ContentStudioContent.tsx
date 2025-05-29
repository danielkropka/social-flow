import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { SUPPORTED_PLATFORMS, PLATFORM_DISPLAY } from "@/constants";
import { Input } from "@/components/ui/input";
import { Plus, Search, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTab } from "@/context/TabContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Account {
  id: string;
  provider: string;
  name?: string;
  username?: string;
  providerAccountId?: string;
  followersCount?: number;
  postsCount?: number;
  avatar?: string;
  lastUpdate?: Date;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function ContentStudioContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<
    Record<string, string>
  >({});
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [refreshingPlatform, setRefreshingPlatform] = useState<string | null>(
    null
  );

  const isMobile = useIsMobile();
  const { setActiveTab } = useTab();
  const [openDialogPlatform, setOpenDialogPlatform] = useState<string | null>(
    null
  );
  const { data: session } = useSession();

  const isLoadingAccounts = accounts.length === 0;

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.accounts || []);
        const grouped = data.accounts.reduce(
          (acc: Record<string, string>, curr: Account) => {
            if (!acc[curr.provider]) acc[curr.provider] = curr.id;
            return acc;
          },
          {}
        );
        setSelectedAccounts(grouped);
      });
  }, []);

  // Funkcja do filtrowania kont po platformie
  const getAccountsByProvider = (provider: string) =>
    accounts.filter((acc) => acc.provider === provider);

  async function handleRefreshAccount(platform: string) {
    setRefreshingPlatform(platform);

    const res = await fetch(`/api/${platform}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session?.user.id,
      }),
    });

    if (!res.ok) {
      toast.error("Nie udało się odświeżyć danych kont");
    }
    toast.success("Dane kont zostały odświeżone.");
    setRefreshingPlatform(null);
  }

  return (
    <div className="px-2 py-4 sm:px-4 md:px-6 lg:px-8 space-y-6">
      {/* Nagłówek */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Przegląd</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-[90vw] sm:max-w-none">
            Podsumowanie informacji o liczbie obserwujących, odwiedzających i
            innych statystykach.
          </p>
        </div>
      </div>

      {/* Selecty do wyboru kont */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6">
        {isLoadingAccounts
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Card
                key={idx}
                className="p-4 sm:p-5 min-h-[160px] sm:min-h-[180px] bg-white shadow-md rounded-2xl border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <Skeleton className="h-4 w-20 sm:w-24 mb-1" />
                    <Skeleton className="h-3 w-12 sm:w-16" />
                  </div>
                </div>
                <div className="flex flex-col items-start mt-2 gap-2">
                  <Skeleton className="h-7 w-20 sm:w-24" />
                  <Skeleton className="h-4 w-12 sm:w-16" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-8 w-24 sm:w-32 rounded-xl" />
                </div>
              </Card>
            ))
          : Object.values(SUPPORTED_PLATFORMS).map((platform) => {
              const { icon: Icon, label } = PLATFORM_DISPLAY[platform];
              const providerAccounts = getAccountsByProvider(platform);
              const hasAccount = providerAccounts.length > 0;
              const selectedId = hasAccount
                ? selectedAccounts[platform] || providerAccounts[0].id
                : undefined;
              const selectedAccount = hasAccount
                ? providerAccounts.find((acc) => acc.id === selectedId) ||
                  providerAccounts[0]
                : undefined;
              console.log(selectedAccount);
              return (
                <Card
                  key={platform}
                  className="p-4 sm:p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px] bg-white shadow-md rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {refreshingPlatform === platform ? (
                      <>
                        <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <Skeleton className="h-4 w-20 sm:w-24 mb-1" />
                          <Skeleton className="h-3 w-12 sm:w-16" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-50 border border-gray-200">
                          <Icon
                            className={`h-5 w-5 sm:h-6 sm:w-6 ${PLATFORM_DISPLAY[platform].color}`}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          {hasAccount ? (
                            <>
                              <span className="font-semibold text-sm sm:text-base truncate max-w-[90px] sm:max-w-[120px] text-gray-900">
                                {selectedAccount?.name ||
                                  selectedAccount?.username ||
                                  selectedAccount?.providerAccountId}
                              </span>
                              <span className="text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[100px]">
                                @
                                {selectedAccount?.username ||
                                  selectedAccount?.providerAccountId}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-sm sm:text-base text-gray-400">
                              Brak konta
                            </span>
                          )}
                          <span className="text-xs text-gray-400 mt-1">
                            {label}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {hasAccount ? (
                        <Dialog
                          open={openDialogPlatform === platform}
                          onOpenChange={(open) =>
                            setOpenDialogPlatform(open ? platform : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs font-medium border-gray-300 hover:bg-gray-100 px-2 sm:px-3 py-1"
                              onClick={() => setOpenDialogPlatform(platform)}
                            >
                              Zmień konto
                            </Button>
                          </DialogTrigger>
                          <button
                            type="button"
                            className="ml-2 p-2 rounded-full border border-gray-200 bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors shadow-sm"
                            title="Odśwież dane konta"
                            onClick={() => handleRefreshAccount(platform)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <DialogContent className="w-full max-w-xs sm:max-w-md p-0 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                            <DialogTitle className="mb-0 text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center pt-4 sm:pt-6 pb-2 border-b border-gray-100 dark:border-neutral-800">
                              Wybierz konto
                            </DialogTitle>
                            {isMobile ? (
                              <div className="flex flex-col gap-2 w-full max-w-xs sm:max-w-md mx-auto">
                                <div className="relative mb-2">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Search className="w-5 h-5" />
                                  </span>
                                  <Input
                                    id={`search-${platform}`}
                                    type="text"
                                    name={`search-${platform}`}
                                    value={searchInputs[platform] || ""}
                                    onChange={(e) =>
                                      setSearchInputs((prev) => ({
                                        ...prev,
                                        [platform]: e.target.value,
                                      }))
                                    }
                                    placeholder="Wyszukaj konto po nazwie lub @username..."
                                    className="w-full pl-10 pr-2 py-2 text-base border border-gray-200 rounded-xl bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all placeholder:text-gray-400"
                                  />
                                </div>
                                {providerAccounts.filter((acc) => {
                                  const val = (
                                    (acc.name || "") +
                                    (acc.username || "") +
                                    (acc.providerAccountId || "")
                                  ).toLowerCase();
                                  return val.includes(
                                    (searchInputs[platform] || "").toLowerCase()
                                  );
                                }).length === 0 ? (
                                  <div className="text-gray-400 text-center py-8 text-base select-none">
                                    Brak podłączonych kont
                                  </div>
                                ) : (
                                  providerAccounts
                                    .filter((acc) => {
                                      const val = (
                                        (acc.name || "") +
                                        (acc.username || "") +
                                        (acc.providerAccountId || "")
                                      ).toLowerCase();
                                      return val.includes(
                                        (
                                          searchInputs[platform] || ""
                                        ).toLowerCase()
                                      );
                                    })
                                    .map((acc) => (
                                      <button
                                        key={acc.id}
                                        type="button"
                                        className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-white dark:bg-neutral-800 shadow border transition-all ${selectedId === acc.id ? "border-primary" : "border-transparent hover:border-primary/40"}`}
                                        onClick={() => {
                                          setSelectedAccounts((prev) => ({
                                            ...prev,
                                            [platform]: acc.id,
                                          }));
                                          setOpenDialogPlatform(null);
                                          if (document.activeElement) {
                                            (
                                              document.activeElement as HTMLElement
                                            ).blur();
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          {/* Avatar konta lub domyślna ikona */}
                                          {acc.avatar ? (
                                            <img
                                              src={acc.avatar}
                                              alt="avatar"
                                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-gray-100"
                                            />
                                          ) : (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                                              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                                            </div>
                                          )}
                                          <div className="flex flex-col text-left">
                                            <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                                              {acc.name ||
                                                acc.username ||
                                                acc.providerAccountId}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px] sm:max-w-[100px]">
                                              @
                                              {acc.username ||
                                                acc.providerAccountId}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-gray-400 dark:text-gray-500">
                                          <svg
                                            width="20"
                                            height="20"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              fill="currentColor"
                                              d="M9.29 6.71a1 1 0 0 1 1.42 0l4 4a1 1 0 0 1 0 1.42l-4 4a1 1 0 1 1-1.42-1.42L12.59 12l-3.3-3.29a1 1 0 0 1 0-1.42Z"
                                            />
                                          </svg>
                                        </span>
                                      </button>
                                    ))
                                )}
                                <button
                                  type="button"
                                  className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-white text-blue-600 font-semibold mt-2 border border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                  onClick={() => setActiveTab("accounts")}
                                >
                                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                    {/* Nowoczesna ikona plusa */}
                                    <svg
                                      width="22"
                                      height="22"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 5v14m7-7H5"
                                      />
                                    </svg>
                                  </span>
                                  Dodaj nowe konto
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col w-full h-[320px] sm:h-[420px]">
                                <div className="p-3 sm:p-4 pb-2 border-b border-gray-100 dark:border-neutral-800">
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                      <Search className="w-5 h-5" />
                                    </span>
                                    <Input
                                      id={`search-${platform}`}
                                      type="text"
                                      name={`search-${platform}`}
                                      value={searchInputs[platform] || ""}
                                      onChange={(e) =>
                                        setSearchInputs((prev) => ({
                                          ...prev,
                                          [platform]: e.target.value,
                                        }))
                                      }
                                      placeholder="Wyszukaj konto po nazwie lub @username..."
                                      className="w-full pl-10 pr-2 py-2 text-base border border-gray-200 rounded-xl bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all placeholder:text-gray-400"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                  {providerAccounts.filter((acc) => {
                                    const val = (
                                      (acc.name || "") +
                                      (acc.username || "") +
                                      (acc.providerAccountId || "")
                                    ).toLowerCase();
                                    return val.includes(
                                      (
                                        searchInputs[platform] || ""
                                      ).toLowerCase()
                                    );
                                  }).length === 0 ? (
                                    <div className="text-gray-400 text-center py-8 text-base select-none">
                                      Brak podłączonych kont
                                    </div>
                                  ) : (
                                    providerAccounts
                                      .filter((acc) => {
                                        const val = (
                                          (acc.name || "") +
                                          (acc.username || "") +
                                          (acc.providerAccountId || "")
                                        ).toLowerCase();
                                        return val.includes(
                                          (
                                            searchInputs[platform] || ""
                                          ).toLowerCase()
                                        );
                                      })
                                      .map((acc) => {
                                        const isSelected =
                                          selectedId === acc.id;
                                        return (
                                          <button
                                            key={acc.id}
                                            type="button"
                                            className={`w-full flex items-center gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-xl transition-all border text-left ${isSelected ? "bg-blue-50 border-blue-500 shadow text-blue-700" : "bg-white dark:bg-neutral-800 border-transparent hover:bg-gray-50 dark:hover:bg-neutral-800/70"}`}
                                            onClick={() => {
                                              setSelectedAccounts((prev) => ({
                                                ...prev,
                                                [platform]: acc.id,
                                              }));
                                              setOpenDialogPlatform(null);
                                              if (document.activeElement) {
                                                (
                                                  document.activeElement as HTMLElement
                                                ).blur();
                                              }
                                            }}
                                          >
                                            {acc.avatar ? (
                                              <img
                                                src={acc.avatar}
                                                alt="avatar"
                                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-gray-100"
                                              />
                                            ) : (
                                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                                                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                              </div>
                                            )}
                                            <div className="flex flex-col text-left flex-1 min-w-0">
                                              <span className="font-semibold text-sm sm:text-base truncate max-w-[90px] sm:max-w-[120px]">
                                                {acc.name ||
                                                  acc.username ||
                                                  acc.providerAccountId}
                                              </span>
                                              <span className="text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[100px]">
                                                @
                                                {acc.username ||
                                                  acc.providerAccountId}
                                              </span>
                                              <span className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                                                {acc.lastUpdate
                                                  ? `Ostatnia synchronizacja: ${new Date(acc.lastUpdate).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                                  : "Brak danych o synchronizacji"}
                                              </span>
                                            </div>
                                            <span className="ml-2 text-gray-400 text-xs">
                                              {acc.followersCount?.toLocaleString() ??
                                                "-"}{" "}
                                              obserwujących
                                            </span>
                                            {isSelected && (
                                              <span className="ml-2 text-blue-500 font-bold text-lg">
                                                ✓
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })
                                  )}
                                </div>
                                <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-neutral-800">
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white text-blue-600 font-semibold border border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                    onClick={() => setActiveTab("accounts")}
                                  >
                                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 flex items-center justify-center">
                                      <svg
                                        width="22"
                                        height="22"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 5v14m7-7H5"
                                        />
                                      </svg>
                                    </span>
                                    Dodaj nowe konto
                                  </button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      ) : null}
                    </div>
                  </div>
                  {hasAccount && selectedAccount ? (
                    refreshingPlatform === platform ? (
                      <div className="flex flex-col items-start mt-2 w-full">
                        <div className="flex items-baseline gap-2">
                          <Skeleton className="h-8 w-16 sm:h-10 sm:w-24 rounded" />
                          <Skeleton className="h-4 w-16 sm:h-5 sm:w-20 rounded ml-2" />
                        </div>
                        <div className="mt-2">
                          <Skeleton className="h-4 w-20 sm:h-5 sm:w-24 rounded" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start mt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {selectedAccount.followersCount?.toLocaleString() ??
                              "-"}
                          </span>
                          <span className="text-sm sm:text-base font-normal text-gray-500">
                            Obserwujących
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          {selectedAccount.postsCount?.toLocaleString() ?? "-"}{" "}
                          postów
                        </div>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-500 text-blue-600 bg-white hover:bg-blue-50 transition-all mt-4 shadow-sm font-semibold text-xs sm:text-base"
                      onClick={() => setActiveTab("accounts")}
                    >
                      <Plus className="w-4 h-4" />
                      Dodaj konto
                    </button>
                  )}
                </Card>
              );
            })}
      </div>
    </div>
  );
}

export default ContentStudioContent;
