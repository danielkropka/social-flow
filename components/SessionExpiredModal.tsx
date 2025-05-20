import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

interface SessionExpiredModalProps {
  isOpen: boolean;
}

export function SessionExpiredModal({ isOpen }: SessionExpiredModalProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(isOpen);

  // Synchronizacja stanu z props
  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  const handleSignIn = () => {
    setIsModalOpen(false);
    router.push("/sign-in");
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-md z-[101]">
        <DialogHeader>
          <DialogTitle>Sesja wygasła</DialogTitle>
          <DialogDescription>
            Twoja sesja wygasła ze względów bezpieczeństwa. Zaloguj się
            ponownie, aby kontynuować.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={handleSignIn}>Zaloguj się ponownie</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
