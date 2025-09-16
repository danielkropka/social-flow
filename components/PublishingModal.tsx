import {MediaUrl} from "@/components/posts/PostCreationForm";
import {ConnectedAccount} from "@prisma/client";

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedAccount[];
  content: string;
  mediaUrls?: MediaUrl[];
}

export function PublishingModal({
}: PublishingModalProps) {

  return (
    <div>W trakcie budowy</div>
  );
}
