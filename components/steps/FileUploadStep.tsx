import { Card } from "@/components/ui/card";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/constants";
import { MediaPreview } from "@/components/MediaPreview";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";

export function FileUploadStep() {
  const {
    selectedFiles,
    previewUrls,
    setSelectedFiles,
    setPreviewUrls,
    setCurrentStep,
  } = usePostCreation();

  const handleFileSelect = (files: File[]) => {
    // Sprawdź czy są filmy
    const hasVideos = files.some((file) => file.type.startsWith("video/"));
    // Sprawdź czy są zdjęcia
    const hasImages = files.some((file) => file.type.startsWith("image/"));

    // Jeśli próbujemy dodać i filmy i zdjęcia
    if (hasVideos && hasImages) {
      toast.error("Nie można dodać jednocześnie zdjęć i filmów");
      return;
    }

    // Jeśli próbujemy dodać więcej niż jeden film
    if (hasVideos && files.length > 1) {
      toast.error("Można dodać tylko jeden film");
      return;
    }

    setSelectedFiles(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setCurrentStep(2);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Wybierz pliki do publikacji
      </h2>
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <MediaPreview
                key={url}
                file={selectedFiles[index]}
                previewUrl={url}
              />
            ))}
          </div>
        ) : (
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              accept={Object.keys(ACCEPTED_FILE_TYPES).join(",")}
              onChange={(e) =>
                handleFileSelect(Array.from(e.target.files || []))
              }
            />
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Przeciągnij i upuść plik lub kliknij
              </p>
              <p className="text-sm text-gray-500">
                Maksymalny rozmiar: {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}
                MB
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Obsługiwane formaty:{" "}
                {Object.values(ACCEPTED_FILE_TYPES).join(", ")}
              </p>
            </div>
          </label>
        )}
      </div>
    </Card>
  );
}
