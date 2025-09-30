import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Check,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PLATFORM_DISPLAY, SUPPORTED_PLATFORMS } from "@/constants";
import { cn } from "@/lib/utils/utils";
import { ConnectedAccount } from "@prisma/client";

const fetchAccounts = async () => {
  const response = await fetch("/api/accounts");
  if (!response.ok) {
    throw new Error("Błąd podczas pobierania kont");
  }

  return await response.json();
};

const removeAccount = async (account: ConnectedAccount) => {
  const response = await fetch("/api/accounts", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: account.id }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Błąd podczas usuwania konta");
  }

  return account;
};

type PlatformKey = keyof typeof PLATFORM_DISPLAY;

export default function AccountsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState<string | null>(null);
  const [accountToRemove, setAccountToRemove] =
    useState<ConnectedAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const modalPlatformInfo = showModal
    ? PLATFORM_DISPLAY[showModal as PlatformKey]
    : null;

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    staleTime: 1000 * 60 * 5, // Dane są "świeże" przez 5 minut
    refetchInterval: 1000 * 60 * 5, // Automatyczne odświeżanie co 5 minut
  });

  const removeAccountMutation = useMutation({
    mutationFn: removeAccount,
    onMutate: async (account) => {
      await queryClient.cancelQueries({ queryKey: ["accounts"] });
      const previousAccounts = queryClient.getQueryData(["accounts"]);
      queryClient.setQueryData(["accounts"], (old: ConnectedAccount[]) =>
        old.map((a) => (a.id === account.id ? { ...a, isLoading: true } : a)),
      );
      return { previousAccounts };
    },
    onError: (err, _, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(["accounts"], context.previousAccounts);
      }
      toast.error("Nie udało się usunąć konta", {
        description:
          err instanceof Error ? err.message : "Spróbuj ponownie później",
      });
    },
    onSuccess: (removedAccount) => {
      toast.success("Konto zostało pomyślnie usunięte", {
        description: `Konto ${removedAccount?.username} zostało odłączone.`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const handleAddAccount = (platform: string) => {
    setShowModal(platform);
  };

  const getConnectedAccounts = (platform: string) => {
    return accounts.filter(
      (account: ConnectedAccount) =>
        account.provider.toLowerCase() === platform,
    );
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedPlatforms([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter accounts based on search and platform filters
  const getFilteredAccounts = (platform: string) => {
    let filtered = getConnectedAccounts(platform);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (account: ConnectedAccount) =>
          account.displayName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          account.username?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  };

  const availablePlatforms = Array.from(
    new Set(accounts.map((account: ConnectedAccount) => account.provider)),
  ) as string[];

  if (isLoading) {
    return (
      <section className="w-full">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Połączone konta
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Zarządzaj swoimi kontami społecznościowymi i planuj posty
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

  return (
    <section className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Połączone konta
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Zarządzaj swoimi kontami społecznościowymi i planuj posty
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
              placeholder="Szukaj kont po nazwie lub użytkowniku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Odśwież
            </button>
          </div>
        </div>

        {/* Platform Filters */}
        {availablePlatforms.length > 1 && (
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
                const platformInfo = PLATFORM_DISPLAY[platform as PlatformKey];

                return (
                  <button
                    key={platform}
                    onClick={() => handlePlatformToggle(platform)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700",
                    ].join(" ")}
                  >
                    {platformInfo?.icon && (
                      <platformInfo.icon className="h-3.5 w-3.5" />
                    )}
                    {platformInfo?.label || platform}
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
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {accounts.length === 0
              ? "Brak połączonych kont"
              : `Wyświetlane wszystkie konta (${accounts.length})`}
          </div>

          {accounts.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <Users className="h-3.5 w-3.5" />
              {accounts.length} {accounts.length === 1 ? "konto" : "kont"}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
          const { icon: Icon, label } = PLATFORM_DISPLAY[platform];
          const filteredAccounts = getFilteredAccounts(platform);
          const shouldShowPlatform =
            selectedPlatforms.length === 0 ||
            selectedPlatforms.includes(platform);

          if (!shouldShowPlatform) return null;

          return (
            <Card
              key={platform}
              className={[
                "relative overflow-hidden border transition-colors",
                "bg-white/70 dark:bg-zinc-900/60 backdrop-blur",
                "hover:border-zinc-300 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <div
                aria-hidden
                className={[
                  "pointer-events-none absolute inset-x-0 -top-16 h-32",
                  "bg-gradient-to-b",
                  "from-zinc-500/10 via-zinc-500/5 to-transparent",
                ].join(" ")}
              />

              <CardHeader className="relative">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                        "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                        "shadow-sm",
                      ].join(" ")}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          PLATFORM_DISPLAY[platform].color,
                        )}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{label}</CardTitle>
                      <CardDescription className="mt-0.5">
                        {filteredAccounts.length} połączonych kont
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAddAccount(platform)}
                    className="gap-2"
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj konto
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredAccounts.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {getConnectedAccounts(platform).length === 0
                            ? "Brak połączonych kont"
                            : "Brak kont spełniających kryteria wyszukiwania"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {getConnectedAccounts(platform).length === 0
                            ? 'Kliknij "Dodaj konto", aby rozpocząć.'
                            : "Spróbuj zmienić filtry lub wyszukiwanie"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredAccounts.map((account: ConnectedAccount) => (
                      <div
                        key={account.id}
                        className={[
                          "group flex items-center justify-between gap-3 p-4 rounded-lg border transition-colors",
                          account.status === "EXPIRED"
                            ? "bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100/50 dark:hover:bg-orange-800/30"
                            : "bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-700/50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {"profileImageUrl" in account &&
                            account.profileImageUrl && (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-zinc-100 dark:ring-zinc-700">
                                <Image
                                  src={account.profileImageUrl!}
                                  alt={account.username!}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {account.displayName || account.username}
                              </p>
                              {account.status === "EXPIRED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                                  Wygasł
                                </span>
                              )}
                            </div>
                            {account.displayName && account.username && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                @{account.username}
                              </p>
                            )}
                            {account.status === "EXPIRED" &&
                              account.lastErrorMessage && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 truncate mt-1">
                                  {account.lastErrorMessage}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {account.status === "EXPIRED" && (
                            <button
                              onClick={() =>
                                handleAddAccount(account.provider.toLowerCase())
                              }
                              className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-full transition-colors"
                              title="Połącz ponownie"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setAccountToRemove(account);
                            }}
                            className="text-red-500 hover:text-red-600 disabled:opacity-50 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors"
                            title="Usuń konto"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showModal && PLATFORM_DISPLAY[showModal as PlatformKey] && (
        <Dialog
          open={!!showModal}
          onOpenChange={() => {
            if (!isConnecting) setShowModal(null);
          }}
        >
          <DialogContent
            className="max-w-2xl"
            aria-busy={isConnecting ? true : undefined}
          >
            <DialogHeader>
              <div className="flex items-start gap-3">
                {modalPlatformInfo && (
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                      "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                      "shadow-sm",
                    ].join(" ")}
                  >
                    <modalPlatformInfo.icon
                      className={cn("h-5 w-5", modalPlatformInfo.color)}
                      aria-hidden="true"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <DialogTitle className="text-xl">
                    Połącz konto {modalPlatformInfo?.label}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-base text-muted-foreground">
                    Zostaniesz przekierowany do oficjalnej strony autoryzacji.
                    Po zakończeniu wrócisz tutaj i Twoje konto będzie gotowe do
                    publikowania.
                  </DialogDescription>
                </div>
              </div>
              <div className="mt-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-4">
                <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>Nie publikujemy nic bez Twojej wyraźnej akceptacji.</li>
                  <li>
                    W każdej chwili możesz odłączyć konto w sekcji Połączone
                    konta.
                  </li>
                </ul>
              </div>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                onClick={() => setShowModal(null)}
                variant="outline"
                disabled={isConnecting}
              >
                Anuluj
              </Button>
              <Button
                onClick={async () => {
                  try {
                    setIsConnecting(true);
                    const response = await fetch(
                      `/api/accounts/connect?provider=${showModal?.toUpperCase()}`,
                      { method: "GET" },
                    );

                    if (!response.ok) {
                      const errorResponse = await response.json();

                      throw new Error(errorResponse.error);
                    }
                    const data = await response.json();
                    if (!data.authUrl) {
                      throw new Error("NoURL");
                    }
                    router.push(data.authUrl);
                  } catch (error: unknown) {
                    if (error instanceof Error) {
                      switch (error.message) {
                        case "UnsupportedProvider":
                          toast.error(
                            "Nieobsługiwana platforma. Spróbuj ponownie później, lub skontaktuj się z administratorem aplikacji.",
                          );
                          break;
                        case "Unauthorized":
                          toast.error(
                            "Nie jesteś zalogowany. Jeżeli, problem występuje po ponownym zalogowaniu skontaktuj się z administratorem aplikacji.",
                          );
                          break;
                        case "NoURL":
                          toast.error(
                            `Brak linku autoryzacyjnego w odpowiedzi od ${PLATFORM_DISPLAY[showModal as PlatformKey].label}.`,
                          );
                          break;
                        case "NoEnvConfiguration":
                          toast.error(
                            `Brak plików konfiguracyjnych z platformą ${PLATFORM_DISPLAY[showModal as PlatformKey].label}.`,
                          );
                          break;
                        case "NoToken":
                          toast.error(
                            "Brak tokenów dostępu w odpowiedzi platformy. Spróbuj ponownie później.",
                          );
                          break;
                        default:
                          toast.error(
                            `Wystąpił nieznany bład podczas próby autoryzacji z ${PLATFORM_DISPLAY[showModal as PlatformKey].label}.`,
                          );
                      }
                    } else
                      toast.error(
                        `Nie udało się połączyć z ${PLATFORM_DISPLAY[showModal as PlatformKey].label}`,
                      );
                  } finally {
                    setIsConnecting(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Łączenie...
                  </span>
                ) : (
                  "Połącz konto"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {accountToRemove && (
        <Dialog
          open={!!accountToRemove}
          onOpenChange={() => setAccountToRemove(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Potwierdzenie usunięcia</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunąć konto{" "}
                <strong>{accountToRemove.username}</strong>?
              </DialogDescription>
              <div className="mt-4 rounded-lg border bg-red-50/50 dark:bg-red-950/20 p-4">
                <span className="text-sm text-red-700 dark:text-red-300">
                  Uwaga: Wszystkie zaplanowane posty dla tego konta zostaną
                  anulowane.
                </span>
              </div>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                onClick={() => setAccountToRemove(null)}
                variant="outline"
              >
                Anuluj
              </Button>
              <Button
                onClick={() => {
                  if (accountToRemove) {
                    removeAccountMutation.mutate(accountToRemove);
                    setAccountToRemove(null);
                  }
                }}
                variant="destructive"
              >
                Usuń konto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
