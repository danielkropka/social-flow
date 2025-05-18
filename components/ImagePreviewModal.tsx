import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";

interface ImagePreviewModalProps {
  file: File;
  children: React.ReactNode;
}

export function ImagePreviewModal({ file, children }: ImagePreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Błąd ładowania obrazu:", file.name);
    const imgElement = e.target as HTMLImageElement;
    imgElement.src = "/placeholder-image.jpg";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[90vw] p-4">
        <DialogTitle className="sr-only">Podgląd obrazu</DialogTitle>
        <div className="relative w-full aspect-square sm:aspect-video flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
          <Image
            src={URL.createObjectURL(file)}
            alt="Podgląd obrazu"
            className="max-w-full max-h-full object-contain"
            fill
            onError={handleError}
            priority={isOpen}
            sizes="(max-width: 768px) 100vw, 90vw"
            quality={90}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
