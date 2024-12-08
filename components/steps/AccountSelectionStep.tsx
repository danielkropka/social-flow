import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Search } from "lucide-react";
import { MediaCarousel } from "@/components/MediaCarousel";
import { usePostCreation } from "@/context/PostCreationContext";
import { socialAccounts } from "@/data/accounts";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function AccountSelectionStep() {
  const {
    selectedFiles,
    previewUrls,
    selectedAccounts,
    setSelectedAccounts,
    setCurrentStep,
  } = usePostCreation();

  const [searchQuery, setSearchQuery] = useState("");

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case "twitter":
        return <Twitter className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
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

  const filteredAccounts = socialAccounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    (acc[account.platform] = acc[account.platform] || []).push(account);
    return acc;
  }, {} as Record<string, typeof socialAccounts>);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Wybierz konta do publikacji
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 mb-2">Wybrane pliki:</p>
        <MediaCarousel files={selectedFiles} urls={previewUrls} />
      </div>

      <div className="relative mb-6">
        <Input
          placeholder="Szukaj kont..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      </div>

      <div
        style={{
          height: "400px",
          overflowY: "auto",
          paddingRight: "8px",
          marginRight: "-8px",
        }}
        className="space-y-6 scroll-smooth"
      >
        <AnimatePresence>
          {Object.entries(groupedAccounts).map(
            ([platform, accounts]) =>
              accounts.length > 0 && (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ marginBottom: "1.5rem" }}
                >
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(platform)}
                    <h3 className="font-medium">{getPlatformName(platform)}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    <AnimatePresence>
                      {accounts.map((account) => (
                        <motion.div
                          key={account.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{
                            borderColor: "#2563eb",
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            border: `1px solid ${
                              selectedAccounts.includes(account.id)
                                ? "#2563eb"
                                : "#e5e7eb"
                            }`,
                            backgroundColor: selectedAccounts.includes(
                              account.id
                            )
                              ? "#eff6ff"
                              : "#ffffff",
                            cursor: "pointer",
                            transition: "border-color 0.2s ease",
                          }}
                        >
                          <div
                            onClick={() => {
                              setSelectedAccounts(
                                selectedAccounts.includes(account.id)
                                  ? selectedAccounts.filter(
                                      (id) => id !== account.id
                                    )
                                  : [...selectedAccounts, account.id]
                              );
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                  src={account.avatar}
                                  alt={account.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100">
                                {getPlatformIcon(account.platform)}
                              </div>
                            </div>
                            <div className="min-w-0 ml-3">
                              <p className="font-medium truncate">
                                {account.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {account.accountType}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
          )}
        </AnimatePresence>

        {Object.values(groupedAccounts).flat().length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: "center",
              padding: "2rem 0",
              color: "#6b7280",
            }}
          >
            Nie znaleziono kont dla zapytania "{searchQuery}"
          </motion.div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => setCurrentStep(3)}
          disabled={selectedAccounts.length === 0}
        >
          Dalej
        </Button>
      </div>
    </Card>
  );
}
