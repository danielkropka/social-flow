import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FaFacebook, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectedAccount, Provider } from "@prisma/client";
import { toast } from "sonner";

interface ConnectedAccountWithDetails extends ConnectedAccount {
  isLoading?: boolean;
}

export default function ConnectAccounts() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ConnectedAccountWithDetails[]>([]);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [accountToRemove, setAccountToRemove] =
    useState<ConnectedAccountWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Błąd podczas pobierania kont");
      }
      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error) {
      console.error("Błąd:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (platform: string) => {
    if (platform === "instagram") {
      setShowInstagramModal(true);
    } else if (platform === "twitter") {
      setShowTwitterModal(true);
    } else if (platform === "facebook") {
      setShowFacebookModal(true);
    } else if (platform === "tiktok") {
      setShowTikTokModal(true);
    }
  };

  const handleRemoveAccount = async () => {
    if (accountToRemove) {
      try {
        setShowDeletionModal(false);

        setAccounts(
          accounts.map((account) =>
            account.id === accountToRemove.id
              ? { ...account, isLoading: true }
              : account
          )
        );

        const response = await fetch(`/api/accounts/${accountToRemove.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Błąd podczas usuwania konta");
        }

        setAccounts(
          accounts.filter((account) => account.id !== accountToRemove.id)
        );
        toast.success("Konto zostało pomyślnie usunięte", {
          description: `Konto ${accountToRemove.name} zostało odłączone.`,
        });
      } catch (error) {
        console.error("Błąd:", error);
        toast.error("Nie udało się usunąć konta", {
          description:
            error instanceof Error ? error.message : "Spróbuj ponownie później",
        });
        setAccounts(
          accounts.map((account) =>
            account.id === accountToRemove.id
              ? { ...account, isLoading: false }
              : account
          )
        );
      } finally {
        setAccountToRemove(null);
      }
    }
  };

  const getPlatformIcon = (platform: Provider) => {
    switch (platform) {
      case "FACEBOOK":
        return <FaFacebook className="h-5 w-5 text-blue-600" />;
      case "INSTAGRAM":
        return <FaInstagram className="h-5 w-5 text-pink-600" />;
      case "TWITTER":
        return <FaTwitter className="h-5 w-5 text-blue-400" />;
      case "TIKTOK":
        return <FaTiktok className="h-5 w-5 text-black" />;
      default:
        return null;
    }
  };

  const getConnectedAccounts = (platform: string) => {
    return accounts.filter(
      (account) => account.provider === (platform.toUpperCase() as Provider)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {["facebook", "instagram", "twitter", "tiktok"].map((platform) => (
        <div
          key={platform}
          className="flex flex-col md:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm"
        >
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            {getPlatformIcon(platform.toUpperCase() as Provider)}
            <span className="font-medium capitalize">{platform}</span>
            <div className="flex flex-col gap-3 md:flex-row items-center overflow-x-auto max-w-full max-h-56 md:max-w-3xl">
              {getConnectedAccounts(platform).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg shadow-inner relative"
                >
                  {account.isLoading && (
                    <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                    </div>
                  )}
                  {account.profileImage && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={account.profileImage}
                        alt={account.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-sm">{account.name}</span>
                  <button
                    onClick={() => {
                      setAccountToRemove(account);
                      setShowDeletionModal(true);
                    }}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    disabled={account.isLoading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => handleAddAccount(platform)}>
            Dodaj konto
          </Button>
        </div>
      ))}

      <Dialog open={showDeletionModal} onOpenChange={setShowDeletionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdzenie usunięcia</DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              <span>
                Czy na pewno chcesz usunąć konto{" "}
                <strong>{accountToRemove?.name}</strong>?
              </span>
              <span className="text-sm text-red-600">
                Uwaga: Wszystkie zaplanowane posty dla tego konta zostaną
                anulowane.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              onClick={() => setShowDeletionModal(false)}
              variant="outline"
            >
              Anuluj
            </Button>
            <Button onClick={handleRemoveAccount} variant="destructive">
              Usuń konto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInstagramModal} onOpenChange={setShowInstagramModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Połączenie z Instagram</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Połącz konto Instagram Creator lub Business, aby móc publikować i
              planować posty na Instagramie.
            </DialogDescription>

            <div className="mt-6">
              <h4 className="font-semibold mb-4">Wymagania:</h4>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem
                  value="item-1"
                  className="border rounded-lg bg-gray-50 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">
                        Wymagane konto Business lub Creator
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <div className="text-gray-600">
                        Obsługiwane są tylko profile Instagram typu Business lub
                        Creator. Profile osobiste nie są wspierane. Przejście na
                        profil Business lub Creator jest łatwe i zajmuje tylko
                        kilka minut.
                      </div>
                      <div className="flex gap-4 pt-2">
                        <Link
                          href="https://help.instagram.com/502981923235522"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>→</span> Jak utworzyć konto firmowe
                        </Link>
                        <Link
                          href="https://help.instagram.com/2358103564437429"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>→</span> Jak utworzyć konto twórcy
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-2"
                  className="border rounded-lg bg-gray-50 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">
                        Wymagane połączenie ze stroną na Facebooku
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <div className="text-gray-600">
                        Upewnij się, że Twój profil jest połączony ze stroną na
                        Facebooku, nawet jeśli nie jest ona używana.
                      </div>
                      <div className="pt-2">
                        <Link
                          href="https://help.instagram.com/399237934150902"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>→</span> Jak połączyć Instagram ze stroną na
                          Facebooku
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowInstagramModal(false)}
              variant="outline"
            >
              Anuluj
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch(
                    "/api/auth/instagram/request-token"
                  );
                  if (!response.ok) {
                    throw new Error("Nie udało się pobrać URL autoryzacji");
                  }
                  const data = await response.json();
                  router.push(data.authUrl);
                } catch (error) {
                  console.error("Błąd podczas łączenia z Instagramem:", error);
                  toast.error("Nie udało się połączyć z Instagramem");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Połącz konto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTwitterModal} onOpenChange={setShowTwitterModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Połączenie z Twitter</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Połącz swoje konto Twitter, aby móc publikować i planować tweety.
            </DialogDescription>

            <div className="mt-6">
              <h4 className="font-semibold mb-4">Wymagania:</h4>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem
                  value="item-1"
                  className="border rounded-lg bg-gray-50 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">
                        Wymagane konto Twitter
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <div className="text-gray-600">
                        Aby połączyć konto Twitter, musisz posiadać aktywne
                        konto na platformie Twitter.
                      </div>
                      <div className="pt-2">
                        <Link
                          href="https://help.twitter.com/pl/using-twitter/create-twitter-account"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>→</span> Jak utworzyć konto na Twitterze
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowTwitterModal(false)}
              variant="outline"
            >
              Anuluj
            </Button>
            <Button
              onClick={async () => {
                setShowTwitterModal(false);
                try {
                  const response = await fetch(
                    "/api/auth/twitter/request-token"
                  );
                  if (!response.ok) {
                    throw new Error("Nie udało się pobrać tokena");
                  }
                  const data = await response.json();

                  if (data.callbackConfirmed !== "true") {
                    throw new Error("Nie udało się pobrać tokena");
                  }

                  router.push(
                    `https://api.x.com/oauth/authorize?oauth_token=${data.token}`
                  );
                } catch (error) {
                  console.error("Błąd podczas łączenia z Twitterem:", error);
                  toast.error("Nie udało się połączyć z Twitterem");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Połącz konto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFacebookModal} onOpenChange={setShowFacebookModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Połączenie ze stroną Facebook</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Połącz swoją stronę na Facebooku, aby móc publikować i planować
              posty.
            </DialogDescription>

            <div className="mt-6">
              <h4 className="font-semibold mb-4">Wymagania:</h4>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem
                  value="item-1"
                  className="border rounded-lg bg-gray-50 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">
                        Wymagana strona na Facebooku
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <div className="text-gray-600">
                        Aby połączyć stronę Facebook, musisz być jej
                        administratorem lub mieć uprawnienia do zarządzania
                        treścią.
                      </div>
                      <div className="pt-2">
                        <Link
                          href="https://www.facebook.com/help/104002523024878"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>→</span> Jak utworzyć stronę na Facebooku
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowFacebookModal(false)}
              variant="outline"
            >
              Anuluj
            </Button>
            <Button
              onClick={async () => {
                setShowFacebookModal(false);
                try {
                  const response = await fetch(
                    "/api/auth/facebook/request-token"
                  );
                  if (!response.ok) {
                    throw new Error("Nie udało się pobrać tokena");
                  }
                  const data = await response.json();
                  router.push(
                    `https://www.facebook.com/v20.0/dialog/oauth?client_id=${data.client_id}&redirect_uri=${data.redirect_uri}&scope=pages_show_list%2Cpages_read_engagement%2Cpages_manage_posts%2Cpublic_profile&response_type=code`
                  );
                } catch (error) {
                  console.error("Błąd podczas łączenia z Facebookiem:", error);
                  toast.error("Nie udało się połączyć ze stroną Facebook");
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Połącz stronę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTikTokModal} onOpenChange={setShowTikTokModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Połączenie z TikTok</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Połącz swoje konto TikTok, aby móc publikować i planować posty.
            </DialogDescription>

            <div className="mt-6">
              <h4 className="font-semibold mb-4">Wymagania:</h4>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem
                  value="item-1"
                  className="border rounded-lg bg-gray-50 px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">
                        Wymagane konto TikTok Business
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <div className="text-gray-600">
                        Aby połączyć konto TikTok, musisz posiadać konto typu
                        Business lub Creator.
                      </div>
                      <div className="pt-2">
                        <Link
                          href="https://www.tiktok.com/business/en"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>→</span> Jak utworzyć konto TikTok Business
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowTikTokModal(false)} variant="outline">
              Anuluj
            </Button>
            <Button
              onClick={async () => {
                setShowTikTokModal(false);
                try {
                  const response = await fetch(
                    "/api/auth/tiktok/request-token"
                  );
                  if (!response.ok) {
                    throw new Error("Nie udało się pobrać tokena");
                  }
                  const data = await response.json();
                  router.push(data.authUrl);
                } catch (error) {
                  console.error("Błąd podczas łączenia z TikTok:", error);
                  toast.error("Nie udało się połączyć z TikTok");
                }
              }}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Połącz konto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
