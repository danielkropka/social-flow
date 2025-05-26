import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/utils";
import { MediaUrl } from "./posts/PostCreationForm";
import { useTab } from "@/context/TabContext";
import { useRouter } from "next/navigation";

// Typy
interface ConnectedAccount {
  id: string;
  name: string;
  provider: string;
}

interface PublishingStatus {
  accountId: string;
  accountName: string;
  provider: string;
  status: "pending" | "success" | "error";
  error?: string;
}

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedAccount[];
  content: string;
  mediaUrls?: MediaUrl[];
}

export function PublishingModal({
  isOpen,
  onClose,
  accounts,
  content,
  mediaUrls = [],
}: PublishingModalProps) {
  const router = useRouter();
  const { setActiveTab } = useTab();
  const [statusList, setStatusList] = useState<PublishingStatus[]>([]);

  // Inicjalizacja statusów
  useEffect(() => {
    if (isOpen) {
      setStatusList(
        accounts.map((acc) => ({
          accountId: acc.id,
          accountName: acc.name,
          provider: acc.provider,
          status: "pending",
        }))
      );
    }
  }, [isOpen, accounts]);

  // Publikowanie po kolei
  useEffect(() => {
    const nextIndex = statusList.findIndex((s) => s.status === "pending");
    if (nextIndex === -1) return; // Wszystko opublikowane

    const publish = async () => {
      const acc = statusList[nextIndex];
      try {
        // Wywołanie odpowiedniego endpointu
        const res = await fetch(`/api/posts/${acc.provider.toLowerCase()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            mediaUrls,
            accountId: acc.accountId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusList((list) =>
            list.map((s, i) =>
              i === nextIndex ? { ...s, status: "success" } : s
            )
          );
        } else {
          setStatusList((list) =>
            list.map((s, i) =>
              i === nextIndex
                ? {
                    ...s,
                    status: "error",
                    error: data.details || data.error || "Błąd publikacji",
                  }
                : s
            )
          );
        }
      } catch (e: unknown) {
        setStatusList((list) =>
          list.map((s, i) =>
            i === nextIndex
              ? {
                  ...s,
                  status: "error",
                  error: e instanceof Error ? e.message : "Błąd publikacji",
                }
              : s
          )
        );
      }
    };

    if (isOpen) publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusList, isOpen]);

  // UI helpers
  const getPlatformIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "facebook":
        return <FaFacebook className="h-5 w-5 text-[#1877F2]" />;
      case "instagram":
        return <FaInstagram className="h-5 w-5 text-[#E4405F]" />;
      case "twitter":
        return <FaTwitter className="h-5 w-5 text-[#1DA1F2]" />;
      case "tiktok":
        return <FaTiktok className="h-5 w-5 text-black" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: PublishingStatus["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getStatusIcon = (status: PublishingStatus["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusText = (status: PublishingStatus["status"]) => {
    switch (status) {
      case "success":
        return "Opublikowano pomyślnie";
      case "error":
        return "Wystąpił błąd";
      default:
        return "Publikowanie...";
    }
  };

  const totalAccounts = statusList.length;
  const completedAccounts = statusList.filter(
    (status) => status.status !== "pending"
  ).length;
  const progress = (completedAccounts / (totalAccounts || 1)) * 100;
  const allCompleted = statusList.every(
    (status) => status.status !== "pending"
  );
  const hasErrors = statusList.some((status) => status.status === "error");

  const handleClose = () => {
    onClose();

    router.push("/dashboard");
    setActiveTab("posts");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Loader2
              className={cn(
                "h-6 w-6 animate-spin text-blue-500",
                allCompleted && "hidden"
              )}
            />
            Publikowanie postów
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-1">
            {allCompleted
              ? hasErrors
                ? "Publikacja zakończona z błędami. Możesz spróbować ponownie dla nieudanych kont."
                : "Wszystkie posty zostały opublikowane pomyślnie!"
              : "Trwa publikowanie postów na wybranych kontach. Możesz zamknąć okno, proces będzie kontynuowany w tle."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">
                Postęp:{" "}
                <span className="text-gray-900">{completedAccounts}</span> /{" "}
                {totalAccounts}
              </span>
              <span className="font-semibold text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full transition-all duration-500"
            />
          </div>

          <div className="space-y-3">
            {statusList.map((status, idx) => (
              <div
                key={status.accountId}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border shadow-sm transition-all duration-300 bg-white/90 animate-fade-in",
                  getStatusColor(status.status),
                  status.status === "pending" && "opacity-80 blur-[1px]"
                )}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex-shrink-0 mt-1">
                  {getPlatformIcon(status.provider)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {status.accountName}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize">
                        {status.provider}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.status)}
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          status.status === "success" && "text-green-600",
                          status.status === "error" && "text-red-600",
                          status.status === "pending" && "text-blue-600"
                        )}
                      >
                        {getStatusText(status.status)}
                      </span>
                    </div>
                  </div>
                  {status.error && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-red-100/80 p-2 rounded-lg border border-red-200 animate-fade-in">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p>{status.error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allCompleted && (
            <div className="pt-6 border-t border-gray-100">
              <Button
                onClick={handleClose}
                className="w-full text-base py-2.5 font-semibold"
                variant={hasErrors ? "destructive" : "default"}
              >
                {hasErrors ? "Spróbuj ponownie nieudane" : "Zamknij"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
