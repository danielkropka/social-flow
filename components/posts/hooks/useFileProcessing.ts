import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MAX_FILE_SIZE } from "@/constants";
import type { SocialAccountWithUsername } from "@/types";

interface UseFileProcessingProps {
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  postType: string;
  isTextOnly: boolean;
  loadVideo: (file: File) => Promise<void>;
  selectedAccounts: SocialAccountWithUsername[];
}

export function useFileProcessing({
  selectedFiles,
  setSelectedFiles,
  postType,
  isTextOnly,
  loadVideo,
  selectedAccounts,
}: UseFileProcessingProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [mediaUrls, setMediaUrls] = useState<
    { url: string; type: string; name: string }[]
  >([]);

  useEffect(() => {
    if (selectedFiles.length === 0) setSelectedPreviewIndex(0);
    else if (selectedPreviewIndex >= selectedFiles.length)
      setSelectedPreviewIndex(0);
  }, [selectedFiles]);

  const getSupportedFormats = () => {
    if (isTextOnly) return [];
    if (postType === "video") {
      return ["MP4", "MOV"];
    } else if (postType === "images") {
      return ["JPG", "PNG"];
    }
    return ["JPG", "PNG", "MP4", "MOV"];
  };

  const getAcceptedFileTypes = () => {
    if (isTextOnly) return "";
    if (postType === "video") {
      return ".mp4,.mov";
    } else if (postType === "images") {
      return ".jpg,.jpeg,.png";
    }
    return ".jpg,.jpeg,.png,.mp4,.mov";
  };

  const PLATFORM_IMAGE_LIMITS: Record<string, { name: string; limit: number }> =
    {
      twitter: { name: "Twitter", limit: 4 },
      facebook: { name: "Facebook", limit: 20 },
      instagram: { name: "Instagram", limit: 10 },
      tiktok: { name: "TikTok", limit: 35 },
    };

  const imageLimitWarnings = Object.entries(PLATFORM_IMAGE_LIMITS)
    .filter(([platform, { limit }]) =>
      selectedAccounts.some(
        (acc) =>
          acc.provider.toLowerCase() === platform.toLowerCase() &&
          selectedFiles.length > limit
      )
    )
    .map(([platform, { name, limit }]) => ({
      name,
      limit,
      platform,
    }));

  const processFiles = async (files: File[]) => {
    try {
      if (isTextOnly) {
        throw new Error("Tryb tekstowy nie obsługuje plików");
      }
      const hasVideos = files.some((file) => file.type.startsWith("video/"));
      const hasImages = files.some((file) => file.type.startsWith("image/"));
      const currentHasVideos = selectedFiles.some((file) =>
        file.type.startsWith("video/")
      );
      const currentHasImages = selectedFiles.some((file) =>
        file.type.startsWith("image/")
      );
      const hasHeic = files.some((file) => {
        const ext = file.name.toLowerCase().split(".").pop();
        return (
          ["heic", "heif"].includes(ext || "") ||
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          ((file.type === "application/octet-stream" || file.type === "") &&
            ["heic", "heif"].includes(ext || ""))
        );
      });
      if (hasHeic) {
        toast.error(
          "Format HEIC/HEIF nie jest obsługiwany. Przekonwertuj zdjęcie do JPG lub PNG."
        );
        return;
      }
      if (
        !isTextOnly &&
        ((hasVideos && currentHasImages) || (hasImages && currentHasVideos))
      ) {
        throw new Error("Nie można dodać jednocześnie zdjęć i filmów");
      }
      if (
        (hasVideos && files.length > 1) ||
        (currentHasVideos && files.length > 0)
      ) {
        throw new Error("Można dodać tylko jeden film");
      }
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(
          `Pliki przekraczają maksymalny rozmiar ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        );
      }
      const processedFiles = files.map(
        (file) => new File([file], file.name, { type: file.type })
      );
      setSelectedFiles([...selectedFiles, ...processedFiles]);
      if (hasVideos) {
        await loadVideo(processedFiles[0]);
      }
      toast.success("Pliki zostały dodane pomyślnie");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error("Wystąpił nieznany błąd podczas przetwarzania plików.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return {
    dragActive,
    setDragActive,
    processFiles,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    getSupportedFormats,
    getAcceptedFileTypes,
    selectedPreviewIndex,
    setSelectedPreviewIndex,
    mediaUrls,
    setMediaUrls,
    imageLimitWarnings,
  };
}
