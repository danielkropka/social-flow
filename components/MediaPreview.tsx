import { ImagePreviewModal } from "./ImagePreviewModal";
import { Button } from "./ui/button";
import { useState } from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { VideoThumbnailModal } from "./VideoThumbnailModal";
import { usePostCreation } from "@/context/PostCreationContext";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { videoRef, error: videoError } = useVideoProcessing();

  if (!previewUrl) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Nieprawidłowy URL mediów</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative">
        {videoError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Błąd odtwarzania wideo</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              muted
              loop
              playsInline
              className={`max-h-[50vh] mx-auto rounded-lg ${className}`}
            />
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
          </>
        )}
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
