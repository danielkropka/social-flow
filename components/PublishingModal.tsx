import { MediaUrl } from "@/components/posts/PostCreationForm";
import { PublicSocialAccount } from "@/types";

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: PublicSocialAccount[];
  content: string;
  mediaUrls?: MediaUrl[];
}

export function PublishingModal({}: PublishingModalProps) {
  return <div>W trakcie budowy</div>;
}
