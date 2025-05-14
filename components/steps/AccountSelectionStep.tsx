import { Button } from "@/components/ui/button";
import { MediaCarousel } from "@/components/MediaCarousel";
import { usePostCreation } from "@/context/PostCreationContext";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";
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
      case "tiktok":
        return <FaTiktok className="h-5 w-5 text-black" />;
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
      case "tiktok":
        return "TikTok";
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

  const handleAccountSelection = (account: ConnectedAccountWithDetails) => {
    const isSelected = selectedAccounts.some(
      (selected) => selected.id === account.id
    );

    if (isSelected) {
      setSelectedAccounts(
        selectedAccounts.filter((selected) => selected.id !== account.id)
      );
    } else {
      setSelectedAccounts([
        ...selectedAccounts,
        {
          id: account.id,
          name: account.name,
          provider: account.provider,
          username: account.username,
        },
      ]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-600 font-medium">
            Ładowanie połączonych kont...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <p className="text-red-500 font-medium">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Wybierz konta do publikacji
        </h2>
        <p className="text-muted-foreground">
          Wybierz jedno lub więcej kont, na których chcesz opublikować post
        </p>
      </div>

      {!isTextOnly && (
        <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Wybrane pliki:
          </p>
          <MediaCarousel files={selectedFiles} urls={mediaUrls} />
        </div>
      )}

      <div className="relative">
        <Input
          placeholder="Szukaj kont po nazwie lub platformie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 w-full border border-gray-300 rounded-xl h-12 text-base"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      <div className="h-[450px] overflow-y-auto pr-2 -mr-2 space-y-8 scroll-smooth">
        {Object.entries(groupedAccounts).map(
          ([platform, platformAccounts]) =>
            platformAccounts.length > 0 && (
              <div key={platform} className="space-y-4 animate-fade-in">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(platform)}
                  <h3 className="font-semibold text-lg text-gray-900">
                    {getPlatformName(platform)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({platformAccounts.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {platformAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelection(account)}
                    >
                      <div
                        className={cn(
                          "flex items-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
                          selectedAccounts.some(
                            (selected) => selected.id === account.id
                          )
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                        )}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                            <Image
                              src={
                                account.profileImage || "/default-avatar.png"
                              }
                              alt={account.username || ""}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 ml-4">
                          <p className="font-semibold text-gray-900 truncate">
                            {account.username || "Brak nazwy"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {getPlatformName(account.provider)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}

        {Object.values(groupedAccounts).flat().length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">
              {accounts.length === 0
                ? "Nie masz jeszcze połączonych kont społecznościowych"
                : `Nie znaleziono kont dla zapytania "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={() => setCurrentStep(3)}
          disabled={selectedAccounts.length === 0}
          className="px-8 py-3 text-base font-medium"
        >
          Dalej
        </Button>
      </div>
    </div>
  );
}
