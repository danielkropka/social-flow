import { useState } from "react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { VideoThumbnailModal } from "./VideoThumbnailModal";
import { usePostCreation } from "@/context/PostCreationContext";
import { Button } from "./ui/button";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
  file: File;
  className?: string;
}

export function MediaPreview({ file, className }: MediaPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const { thumbnailUrl } = usePostCreation();

  if (file.type.startsWith("video/")) {
    return (
      <div className="relative w-full h-full">
        {videoError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 text-sm">Błąd odtwarzania wideo</p>
          </div>
        ) : (
          <>
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={URL.createObjectURL(file)}
                className={cn("max-h-[70vh] h-auto rounded-lg", className)}
                onError={() => setVideoError(true)}
                controls
                loop
                muted
                playsInline
                style={{ width: "fit-content" }}
              />
              {thumbnailUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2 bg-white/90 hover:bg-white"
                  onClick={() => setIsModalOpen(true)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Zmień miniaturkę
                </Button>
              )}
            </div>
            {isModalOpen && (
              <VideoThumbnailModal
                isOpen={isModalOpen}
                videoFile={file}
                currentThumbnail={thumbnailUrl || ""}
                onClose={() => setIsModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <ImagePreviewModal file={file}>
      <div className="relative w-full h-full">
        <img
          src={URL.createObjectURL(file)}
          alt="Podgląd"
          className={cn("w-full h-full object-cover rounded-lg", className)}
        />
      </div>
    </ImagePreviewModal>
  );
}
