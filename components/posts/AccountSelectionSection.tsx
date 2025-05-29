import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { PLATFORM_DISPLAY } from "@/constants";
import React from "react";
import type { SocialAccountWithUsername } from "@/types";
import { IconType } from "react-icons";

interface AccountSelectionSectionProps {
  accounts: SocialAccountWithUsername[];
  selectedAccounts: SocialAccountWithUsername[];
  setSelectedAccounts: (accounts: SocialAccountWithUsername[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPlatforms: string[];
  setSelectedPlatforms: (fn: (prev: string[]) => string[]) => void;
  getAvailablePlatforms: () => { id: string; name: string; icon: IconType }[];
  groupedAccounts: Record<string, SocialAccountWithUsername[]>;
  isLoading: boolean;
}

export function AccountSelectionSection({
  selectedAccounts,
  setSelectedAccounts,
  searchQuery,
  setSearchQuery,
  selectedPlatforms,
  setSelectedPlatforms,
  getAvailablePlatforms,
  groupedAccounts,
  isLoading,
}: AccountSelectionSectionProps) {
  const handleAccountSelection = (account: SocialAccountWithUsername) => {
    const isSelected = selectedAccounts.some(
      (selected) => selected.id === account.id
    );
    if (isSelected) {
      setSelectedAccounts(
        selectedAccounts.filter((selected) => selected.id !== account.id)
      );
    } else {
      setSelectedAccounts([...selectedAccounts, { ...account }]);
    }
  };
  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200 sticky top-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Szukaj kont..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          {getAvailablePlatforms().map((platform) => {
            const { icon: Icon } =
              PLATFORM_DISPLAY[platform.id as keyof typeof PLATFORM_DISPLAY];
            return (
              <TooltipProvider key={platform.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={
                        selectedPlatforms.includes(platform.id)
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{platform.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {isLoading ? (
          <>
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
              >
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </>
        ) : (
          Object.entries(groupedAccounts).map(([platform, accounts]) => {
            const { icon: Icon } =
              PLATFORM_DISPLAY[platform as keyof typeof PLATFORM_DISPLAY];
            return (
              <div key={platform} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
                  <Icon className="h-5 w-5" />
                  {getAvailablePlatforms().find((p) => p.id === platform)?.name}
                  <span className="text-xs text-gray-500">
                    ({accounts.length})
                  </span>
                </h3>
                <div className="grid gap-2">
                  {accounts.map((account: SocialAccountWithUsername) => (
                    <button
                      key={account.id}
                      onClick={() => handleAccountSelection(account)}
                      className={
                        selectedAccounts.some(
                          (selected) => selected.id === account.id
                        )
                          ? "flex items-center gap-3 p-3 rounded-lg border border-blue-500 bg-blue-50 transition-all duration-300"
                          : "flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all duration-300"
                      }
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Avatar className="w-10 h-10">
                          {account.avatar ? (
                            <Image
                              src={account.avatar}
                              alt={account.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <AvatarFallback className="text-sm font-medium">
                              {account.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">
                          {account.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{account.username}
                        </p>
                      </div>
                      {selectedAccounts.some(
                        (selected) => selected.id === account.id
                      ) && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-blue-500 font-medium">
                            Wybrane
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
