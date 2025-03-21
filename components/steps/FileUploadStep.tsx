import React, { useRef } from "react";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/constants";
import { MediaPreview } from "@/components/MediaPreview";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Upload } from "lucide-react";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";

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
    content,
    setContent,
  } = usePostCreation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loadVideo, createThumbnail } = useVideoProcessing({
    onError: (error) => toast.error(error.message),
  });

  const processFiles = async (files: File[]) => {
    try {
      if (isTextOnly) throw new Error("Tryb tekstowy nie obsługuje plików");

      // Sprawdzanie typów plików
      const hasVideos = files.some((file) => file.type.startsWith("video/"));
      const hasImages = files.some((file) => file.type.startsWith("image/"));

      if (hasVideos && hasImages) {
        throw new Error("Nie można dodać jednocześnie zdjęć i filmów");
      }

      if (hasVideos && files.length > 1) {
        throw new Error("Można dodać tylko jeden film");
      }

      // Sprawdzanie rozmiaru plików
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(
          `Pliki przekraczają maksymalny rozmiar ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`
        );
      }

      setSelectedFiles(files);

      // Konwertuj pliki na base64
      const base64Urls = await Promise.all(
        files.map(async (file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              if (!base64) {
                reject(
                  new Error(`Nie udało się przeczytać pliku ${file.name}`)
                );
                return;
              }
              resolve(base64);
            };
            reader.onerror = () =>
              reject(new Error(`Błąd podczas czytania pliku ${file.name}`));
            reader.readAsDataURL(file);
          });
        })
      );

      if (base64Urls.some((url) => !url)) {
        throw new Error("Nie udało się przetworzyć wszystkich plików");
      }

      setMediaUrls(base64Urls);

      // Obsługa wideo
      if (hasVideos) {
        await loadVideo(files[0]);
        const thumbnail = await createThumbnail();
        setThumbnailUrl(thumbnail);
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
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const togglePostMode = (mode: boolean) => {
    setIsTextOnly(mode);
    if (mode) {
      setSelectedFiles([]);
      setMediaUrls([]);
      setThumbnailUrl(null);
    }
  };

  const handleTextSubmit = () => {
    if (!content.trim()) {
      toast.error("Wprowadź tekst posta");
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex border rounded-lg overflow-hidden relative bg-white shadow-sm">
        <button
          className={cn(
            "flex-1 py-3 px-4 text-center transition-all duration-300 flex items-center justify-center gap-2",
            !isTextOnly
              ? "text-blue-500 bg-blue-50"
              : "text-gray-500 hover:text-gray-700"
          )}
          onClick={() => togglePostMode(false)}
        >
          <ImageIcon className="w-5 h-5" />
          <span>Post z mediami</span>
        </button>
        <button
          className={cn(
            "flex-1 py-3 px-4 text-center transition-all duration-300 flex items-center justify-center gap-2",
            isTextOnly
              ? "text-blue-500 bg-blue-50"
              : "text-gray-500 hover:text-gray-700"
          )}
          onClick={() => togglePostMode(true)}
        >
          <FileText className="w-5 h-5" />
          <span>Post tekstowy</span>
        </button>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-all duration-300 animate-fade-in",
          isTextOnly
            ? "border-gray-200 bg-white"
            : "border-gray-200 bg-gray-50 hover:border-blue-500 hover:bg-blue-50/50",
          isTextOnly ? "cursor-text" : "cursor-pointer"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isTextOnly && fileInputRef.current?.click()}
      >
        {isTextOnly ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Treść posta
              </h3>
              <p className="text-sm text-gray-500">
                Napisz tekst, który chcesz opublikować na wybranych platformach
              </p>
            </div>
            <div className="space-y-4">
              <Textarea
                className="w-full h-48 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Zacznij pisać swój post tutaj..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Minimalna długość: 1 znak</span>
                <span>{content.length} znaków</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleTextSubmit}
                disabled={!content.trim()}
                className="px-8 py-2"
              >
                Dalej
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {mediaUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaUrls.map((url, index) => (
                  <div
                    key={url}
                    className="aspect-square animate-fade-in-scale group relative"
                  >
                    <MediaPreview
                      file={selectedFiles[index]}
                      previewUrl={url}
                      className="w-full h-full object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xl font-medium text-gray-900">
                    Przeciągnij i upuść pliki tutaj
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    lub kliknij, aby wybrać pliki
                  </p>
                </div>
                <div className="text-sm text-gray-400 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <p className="flex items-center justify-center">
                    <span>Obsługiwane formaty:</span>
                    <span className="font-medium ml-1">
                      {Object.values(ACCEPTED_FILE_TYPES).join(", ")}
                    </span>
                  </p>
                  <p className="flex items-center justify-center">
                    <span>Maksymalny rozmiar pliku:</span>
                    <span className="font-medium ml-1">
                      {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB
                    </span>
                  </p>
                </div>
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
        onChange={(e) => processFiles(Array.from(e.target.files || []))}
      />
    </div>
  );
}
