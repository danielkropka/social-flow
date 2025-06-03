import { useState } from "react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { cn } from "@/lib/utils/utils";

interface MediaPreviewProps {
  file: File;
  className?: string;
}

export function MediaPreview({ file, className }: MediaPreviewProps) {
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (file.type.startsWith("video/")) {
    return (
      <div className="relative w-full h-full">
        {videoError ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 text-sm">Błąd odtwarzania wideo</p>
          </div>
        ) : (
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
          </div>
        )}
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500 text-sm">Błąd ładowania obrazu</p>
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
          onError={() => setImageError(true)}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          loading="lazy"
        />
      </div>
    </ImagePreviewModal>
  );
}
