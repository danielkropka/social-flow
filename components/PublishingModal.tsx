import {MediaUrl} from "@/components/posts/PostCreationForm";
import type {SocialAccountWithUsername} from "@/types";

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SocialAccountWithUsername[];
  content: string;
  mediaUrls?: MediaUrl[];
}

export function PublishingModal({
}: PublishingModalProps) {

  return (
    <div>W trakcie budowy</div>
  );
}
