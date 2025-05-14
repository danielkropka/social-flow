import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";

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
  publishingStatus: PublishingStatus[];
}

export function PublishingModal({
  isOpen,
  onClose,
  publishingStatus,
}: PublishingModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Status publikacji</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {publishingStatus.map((status) => (
            <div
              key={status.accountId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getPlatformIcon(status.provider)}
                <div className="flex flex-col">
                  <span className="font-medium">{status.accountName}</span>
                  <span className="text-sm text-gray-500 capitalize">
                    {status.provider}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                {status.status === "pending" && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                )}
                {status.status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {status.status === "error" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
