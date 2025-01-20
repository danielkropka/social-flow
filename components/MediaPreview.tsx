import { ImagePreviewModal } from "./ImagePreviewModal";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { VideoThumbnailModal } from "./VideoThumbnailModal";
import { usePostCreation } from "@/context/PostCreationContext";

interface MediaPreviewProps {
  file: File;
  previewUrl: string;
  className?: string;
}

export function MediaPreview({
  file,
  previewUrl,
  className,
}: MediaPreviewProps) {
  const { thumbnailUrl } = usePostCreation();
  const isVideo = file.type.startsWith("video/");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isVideo) {
    return (
      <div className="relative">
        <video
          ref={videoRef}
          src={previewUrl}
          controls
          autoPlay
          muted
          className={`max-h-[50vh] mx-auto rounded-lg ${className}`}
        >
          <source src={previewUrl} type={file.type} />
          Twoja przeglądarka nie obsługuje odtwarzania wideo.
        </video>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
          onClick={() => setIsModalOpen(true)}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Zmień miniaturę
        </Button>
        <VideoThumbnailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoUrl={previewUrl}
          currentThumbnail={thumbnailUrl!}
        />
      </div>
    );
  }

  return (
    <ImagePreviewModal url={previewUrl}>
      <div className="flex justify-center items-center h-[50vh]">
        <Image
          src={previewUrl}
          alt={file.name}
          className={`object-contain ${className}`}
          width={670}
          height={670}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </ImagePreviewModal>
  );
}
