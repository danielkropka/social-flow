import { ImagePreviewModal } from "./ImagePreviewModal";
import { Button } from "./ui/button";
import { Image } from "lucide-react";
import { useState } from "react";
import { VideoThumbnailModal } from "./VideoThumbnailModal";

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
  const isVideo = file.type.startsWith("video/");
  const [thumbnailUrl, setThumbnailUrl] = useState(previewUrl);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isVideo) {
    return (
      <div className="relative">
        <video
          src={previewUrl}
          controls
          className={`max-h-[50vh] mx-auto rounded-lg ${className}`}
          poster={thumbnailUrl}
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
          <Image className="h-4 w-4 mr-1" />
          Zmień miniaturę
        </Button>
        <VideoThumbnailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoUrl={previewUrl}
          onThumbnailSelect={setThumbnailUrl}
          currentThumbnail={thumbnailUrl}
        />
      </div>
    );
  }

  return (
    <ImagePreviewModal url={previewUrl}>
      <img
        src={previewUrl}
        alt={file.name}
        className={`max-w-[50vh] object-contain mx-auto ${className}`}
      />
    </ImagePreviewModal>
  );
}
