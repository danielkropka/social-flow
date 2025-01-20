import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/constants";
import { MediaPreview } from "@/components/MediaPreview";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FileUploadStep() {
  const {
    selectedFiles,
    mediaUrls,
    setSelectedFiles,
    setCurrentStep,
    setMediaUrls,
    setIsTextOnly,
    setThumbnailUrl,
    isTextOnly,
  } = usePostCreation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (files: File[]) => {
    try {
      if (isTextOnly) throw new Error("Tryb tekstowy nie obsługuje plików");
      const hasVideos = files.some((file) => file.type.startsWith("video/"));
      const hasImages = files.some((file) => file.type.startsWith("image/"));

      if (hasVideos && hasImages) {
        throw new Error("Nie można dodać jednocześnie zdjęć i filmów");
      }

      if (hasVideos && files.length > 1) {
        throw new Error("Można dodać tylko jeden film");
      }

      setSelectedFiles(files);
      const urls = files.map((file) => URL.createObjectURL(file));
      setMediaUrls(urls);

      if (files[0].type.startsWith("video/")) {
        const videoElement = document.createElement("video");
        videoElement.src = urls[0];
        videoElement.onloadeddata = () => {
          videoElement.currentTime = 0;
        };
        videoElement.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Context not found");
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          setThumbnailUrl(canvas.toDataURL("image/png"));
        };
      }

      setCurrentStep(2);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error("Wystąpił nieznany błąd podczas przetwarzania plików.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const togglePostMode = (mode: boolean) => {
    setIsTextOnly(mode);
  };

  return (
    <Card className="p-6 shadow-md rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Utwórz post</h2>
      <div className="flex border-b mb-4 relative">
        <button
          className={cn(
            "flex-1 py-2 text-center transition-colors duration-300",
            !isTextOnly ? "text-blue-500" : "text-gray-500"
          )}
          onClick={() => togglePostMode(false)}
        >
          Post z mediami
        </button>
        <button
          className={cn(
            "flex-1 py-2 text-center transition-colors duration-300",
            isTextOnly ? "text-blue-500" : "text-gray-500"
          )}
          onClick={() => togglePostMode(true)}
        >
          Post tekstowy
        </button>
        <div
          className={cn(
            "absolute bottom-0 h-0.5 bg-blue-500 transition-transform duration-300",
            isTextOnly ? "translate-x-full" : "translate-x-0"
          )}
          style={{ width: "50%" }}
        />
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-14 transition-colors duration-300",
          isTextOnly
            ? "border-gray-300"
            : "border-gray-300 cursor-pointer hover:border-blue-500",
          isTextOnly ? "bg-white" : "bg-gray-50 hover:bg-blue-50"
        )}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isTextOnly ? (
          <textarea
            className="w-full h-32 p-2 border rounded"
            placeholder="Zacznij pisać swój post tutaj..."
          />
        ) : (
          <div className="text-center">
            {mediaUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaUrls.map((url, index) => (
                  <div key={url} className="aspect-square">
                    <MediaPreview
                      file={selectedFiles[index]}
                      previewUrl={url}
                      className="w-full h-full object-cover rounded-md shadow-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-gray-500">
                  Przeciągnij i upuść pliki tutaj lub kliknij, aby przesłać
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Obsługiwane formaty:{" "}
                  {Object.values(ACCEPTED_FILE_TYPES).join(", ")}
                </p>
                <p className="text-sm text-gray-400">
                  Maksymalny rozmiar pliku:{" "}
                  {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={Object.values(ACCEPTED_FILE_TYPES).join(",")}
        className="hidden"
        onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
      />
    </Card>
  );
}
