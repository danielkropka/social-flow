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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Status publikacji
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {allCompleted
              ? hasErrors
                ? "Publikacja zakończona z błędami"
                : "Wszystkie posty zostały opublikowane pomyślnie"
              : "Publikowanie postów w toku..."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Postęp: {completedAccounts} z {totalAccounts}
              </span>
              <span className="font-medium text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {statusList.map((status) => (
              <div
                key={status.accountId}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
                  getStatusColor(status.status)
                )}
              >
                <div className="flex-shrink-0">
                  {getPlatformIcon(status.provider)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {status.accountName}
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {status.provider}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.status)}
                      <span
                        className={cn(
                          "text-sm font-medium",
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
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50/50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p>{status.error}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {allCompleted && (
            <div className="pt-4 border-t border-gray-100">
              <Button
                onClick={onClose}
                className="w-full"
                variant={hasErrors ? "destructive" : "default"}
              >
                {hasErrors ? "Spróbuj ponownie" : "Zamknij"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
