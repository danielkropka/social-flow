import { Button } from "@/components/ui/button";
import { MediaCarousel } from "@/components/MediaCarousel";
import { usePostCreation } from "@/context/PostCreationContext";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { Search, Loader2, Users } from "lucide-react";
import { ConnectedAccount } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ConnectedAccountWithDetails extends ConnectedAccount {
  accountType?: string;
}

export function AccountSelectionStep() {
  const {
    selectedFiles,
    mediaUrls,
    selectedAccounts,
    setSelectedAccounts,
    setCurrentStep,
    isTextOnly,
  } = usePostCreation();

  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<ConnectedAccountWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/accounts");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać połączonych kont");
        }
        const data = await response.json();
        setAccounts(Array.isArray(data) ? data : data.accounts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
        setAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <FaFacebook className="h-5 w-5 text-blue-600" />;
      case "instagram":
        return <FaInstagram className="h-5 w-5 text-pink-600" />;
      case "twitter":
        return <FaTwitter className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return "Facebook";
      case "instagram":
        return "Instagram";
      case "twitter":
        return "Twitter";
      default:
        return platform;
    }
  };

  const filteredAccounts = (accounts || []).filter(
    (account) =>
      account.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    const platform = account.provider.toLowerCase();
    (acc[platform] = acc[platform] || []).push(account);
    return acc;
  }, {} as Record<string, ConnectedAccountWithDetails[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-500">Ładowanie połączonych kont...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isTextOnly && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-2">Wybrane pliki:</p>
          <MediaCarousel files={selectedFiles} urls={mediaUrls} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Wybierz konta na których chcesz opublikować post
        </h2>
        <p className="text-gray-500">
          Możesz wybrać jedno lub więcej kont do publikacji
        </p>
      </div>

      <div className="relative">
        <Input
          placeholder="Szukaj kont..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full border border-gray-300 rounded-lg"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
      </div>

      <div className="h-[400px] overflow-y-auto pr-2 -mr-2 space-y-6 scroll-smooth">
        {Object.entries(groupedAccounts).map(
          ([platform, platformAccounts]) =>
            platformAccounts.length > 0 && (
              <div key={platform} className="space-y-4 animate-fade-in">
                <div className="flex items-center space-x-2">
                  {getPlatformIcon(platform)}
                  <h3 className="font-medium text-gray-900">
                    {getPlatformName(platform)}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {platformAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => {
                        setSelectedAccounts(
                          selectedAccounts.includes(account.id)
                            ? selectedAccounts.filter((id) => id !== account.id)
                            : [...selectedAccounts, account.id]
                        );
                      }}
                    >
                      <div
                        className={cn(
                          "flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer animate-fade-in-scale",
                          selectedAccounts.includes(account.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center w-full">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                              <Image
                                src={
                                  account.profileImage || "/default-avatar.png"
                                }
                                alt={account.username || ""}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                          </div>
                          <div className="min-w-0 ml-3">
                            <p className="font-medium text-gray-900 truncate">
                              {account.username || "Brak nazwy"}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {getPlatformName(account.provider)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}

        {Object.values(groupedAccounts).flat().length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {accounts.length === 0
                ? "Nie masz jeszcze połączonych kont społecznościowych"
                : `Nie znaleziono kont dla zapytania "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setCurrentStep(3)}
          disabled={selectedAccounts.length === 0}
          className="px-8 py-2"
        >
          Dalej
        </Button>
      </div>
    </div>
  );
}
