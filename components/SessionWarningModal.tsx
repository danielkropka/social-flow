import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SessionWarningModalProps {
  isOpen: boolean;
}

export function SessionWarningModal({ isOpen }: SessionWarningModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>Uwaga - sesja wkrótce wygaśnie</DialogTitle>
          <DialogDescription>
            Twoja sesja wygaśnie za 5 minut. Sesja zostanie automatycznie
            przedłużona, gdy wykryjemy Twoją aktywność.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
