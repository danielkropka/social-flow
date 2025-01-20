import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ImagePreviewModalProps {
  url: string;
  children: React.ReactNode;
}

export function ImagePreviewModal({ url, children }: ImagePreviewModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[90vw] p-4">
        <DialogTitle className="sr-only">Podgląd obrazu</DialogTitle>
        <div className="relative w-full aspect-square sm:aspect-video flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
          <Image
            src={url}
            alt="Podgląd obrazu"
            className="max-w-full max-h-full object-contain"
            fill
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
