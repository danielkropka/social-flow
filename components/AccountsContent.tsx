import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Loader2, X, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SUPPORTED_PLATFORMS, PLATFORM_DISPLAY } from "@/constants";
import { cn } from "@/lib/utils/utils";

interface ConnectedAccountWithDetails {
  id: string;
  avatar?: string;
  provider: string;
  name: string;
  username: string;
  providerAccountId: string;
  followersCount: number;
  postsCount: number;
  lastUpdate: string;
  isLoading?: boolean;
}

const fetchAccounts = async () => {
  const response = await fetch("/api/accounts");
  if (!response.ok) {
    throw new Error("Błąd podczas pobierania kont");
  }
  const data = await response.json();
  return data.accounts;
};

const removeAccount = async (account: ConnectedAccountWithDetails) => {
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
    useState<ConnectedAccountWithDetails | null>(null);

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
      queryClient.setQueryData(
        ["accounts"],
        (old: ConnectedAccountWithDetails[]) =>
          old.map((a) => (a.id === account.id ? { ...a, isLoading: true } : a))
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
        description: `Konto ${removedAccount?.name} zostało odłączone.`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const handleAddAccount = (platform: string) => {
    setShowModal(platform);
  };

  const handleRemoveAccount = async () => {
    if (accountToRemove) {
      removeAccountMutation.mutate(accountToRemove);
      setAccountToRemove(null);
    }
  };

  const getConnectedAccounts = (platform: string) => {
    return accounts.filter(
      (account: ConnectedAccountWithDetails) => account.provider === platform
    );
  };

  console.log(accounts);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {Object.values(SUPPORTED_PLATFORMS).map((platform) => (
            <div
              key={platform}
              className="flex flex-col gap-4 p-6 border border-gray-100 rounded-xl shadow-sm bg-white"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Połączone konta</h1>
        <p className="text-gray-600">
          Zarządzaj swoimi kontami społecznościowymi i planuj posty
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
          const { icon: Icon, label } = PLATFORM_DISPLAY[platform];
          return (
            <div
              key={platform}
              className="flex flex-col gap-4 p-6 border border-gray-100 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn("h-5 w-5", PLATFORM_DISPLAY[platform].color)}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg capitalize text-gray-900">
                      {label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getConnectedAccounts(platform).length} połączonych kont
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleAddAccount(platform)}
                  className="w-full md:w-auto gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj konto
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {getConnectedAccounts(platform).length === 0 ? (
                  <div className="col-span-full flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-center">
                      Brak połączonych kont. Kliknij &quot;Dodaj konto&quot;,
                      aby rozpocząć.
                    </p>
                  </div>
                ) : (
                  getConnectedAccounts(platform).map(
                    (account: ConnectedAccountWithDetails) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {account.isLoading && (
                            <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
                          )}
                          {"avatar" in account && account.avatar && (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100">
                              <Image
                                src={account.avatar}
                                alt={account.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {account.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setAccountToRemove(account);
                          }}
                          className="text-red-500 hover:text-red-600 disabled:opacity-50 flex-shrink-0 p-1 hover:bg-red-50 rounded-full transition-colors"
                          disabled={account.isLoading}
                          title="Usuń konto"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && PLATFORM_DISPLAY[showModal as PlatformKey] && (
        <Dialog open={!!showModal} onOpenChange={() => setShowModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Połączenie z {PLATFORM_DISPLAY[showModal as PlatformKey].label}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Połącz swoje konto{" "}
                {PLATFORM_DISPLAY[showModal as PlatformKey].label}, aby móc
                publikować i planować posty.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowModal(null)} variant="outline">
                Anuluj
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `/api/accounts/connect?provider=${showModal}`
                    );
                    if (!response.ok) {
                      throw new Error("Nie udało się pobrać URL autoryzacji");
                    }
                    const data = await response.json();
                    router.push(data.authUrl);
                  } catch (error) {
                    toast.error(
                      `Nie udało się połączyć z ${PLATFORM_DISPLAY[showModal as PlatformKey].label}`
                    );
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Połącz konto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
