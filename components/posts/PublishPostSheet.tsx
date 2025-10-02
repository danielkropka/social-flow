"use client";

import React, { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Send,
  Image as ImageIcon,
  Video,
  ArrowLeft,
  Loader2,
  Trash2,
  Sparkles,
  File,
  CheckCircle,
  CloudUpload,
} from "lucide-react";
import { SiTiktok, SiFacebook, SiX, SiInstagram } from "react-icons/si";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";
import { MediaUploadResponse, UploadedFileData } from "@/types";
import { checkFileExtension } from "@/lib/utils/utils";

interface MediaUrl {
  url: string;
  type: string;
}

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  TWITTER:
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900",
  FACEBOOK:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
  INSTAGRAM:
    "bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-900",
  TIKTOK:
    "bg-neutral-900 text-white border-neutral-800 dark:bg-neutral-900 dark:text-white dark:border-neutral-800",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  TWITTER: <SiX className="h-3.5 w-3.5" />,
  FACEBOOK: <SiFacebook className="h-3.5 w-3.5" />,
  INSTAGRAM: <SiInstagram className="h-3.5 w-3.5" />,
  TIKTOK: <SiTiktok className="h-3.5 w-3.5" />,
};

const PLATFORM_NAMES: Record<string, string> = {
  TWITTER: "Twitter (X)",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

interface PublishPostSheetProps {
  onClose: () => void;
}

// Motion/visual utils aligned with TypeSelectionSheet / AccountSelectionSheet
const shineOverlay =
  "before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(600px_200px_at_var(--x,50%)_-20%,rgba(255,255,255,0.25),transparent_60%)] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300";
const gradientRing =
  "ring-1 ring-transparent group-hover:ring-zinc-200/70 dark:group-hover:ring-zinc-700/60";
const glassPanel =
  "bg-white/70 dark:bg-zinc-900/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur";

export default function PublishPostSheet({ onClose }: PublishPostSheetProps) {
  const {
    postType,
    selectedFiles,
    selectedAccounts,
    postText,
    setSelectedFiles,
    setPostText,
    setCurrentStep,
    resetState,
  } = usePostCreation();

  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      if (isUploading) {
        console.warn("Upload already in progress, skipping...");
        return;
      }

      setIsUploading(true);
      setUploadProgress({});

      try {
        const uploadPromises = files.map(
          async (file: File): Promise<UploadedFileData> => {
            // check file size before uploading
            if (file.size > 4 * 1024 * 1024) throw new Error("FileTooLarge");

            // check file type before uploading
            if (!checkFileExtension(file)) throw new Error("InvalidFileType");

            // Initialize progress for this file
            setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/media/upload", {
              method: "POST",
              body: formData,
              headers: {
                "X-File-Name": file.name,
                "X-File-Type": file.type,
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error);
            }

            const result: MediaUploadResponse = await response.json();

            if (!result.url) {
              throw new Error("NoURL");
            }

            // Mark as completed
            setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

            return {
              file: file,
              url: result.url,
              fileName: file.name,
              contentType: file.type,
              size: file.size,
            };
          },
        );

        const uploadedFiles = await Promise.all(uploadPromises);
        setSelectedFiles([...selectedFiles, ...uploadedFiles]);
        toast.success(`Przesłano ${uploadedFiles.length} plik(ów)`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          switch (error.message) {
            case "FileTooLarge":
              toast.error("Plik jest za duży. Maksymalny rozmiar to 4MB.");
              break;
            case "InvalidFileType":
              toast.error("Nieobsługiwany typ pliku.");
              break;
            case "NoURL":
              toast.error("Błąd podczas przesyłania pliku.");
              break;
            default:
              toast.error(error.message);
          }
        } else {
          toast.error("Wystąpił błąd podczas przesyłania plików");
        }
      } finally {
        setIsUploading(false);
        setUploadProgress({});
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [selectedFiles, setSelectedFiles, isUploading],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      handleFileUpload(files);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    },
    [handleFileUpload],
  );

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles(
      selectedFiles.filter((file) => file.fileName !== fileName),
    );
  };

  const handlePublish = useCallback(async () => {
    if (!postText.default.trim()) {
      toast.error("Wpisz treść posta");
      return;
    }

    if (selectedAccounts.length === 0) {
      toast.error("Wybierz przynajmniej jedno konto");
      return;
    }

    // Sprawdź czy już trwa publikacja - zapobiega wielokrotnym wywołaniom
    if (isPublishing) {
      console.warn("Publishing already in progress, skipping...");
      return;
    }

    setIsPublishing(true);

    try {
      // Przygotowujemy media URLs (pliki już zostały przesłane na AWS S3)
      let mediaUrls: MediaUrl[] = [];

      if (selectedFiles.length > 0) {
        mediaUrls = selectedFiles.map((fileData) => {
          return {
            url: fileData.url,
            type: fileData.contentType,
          };
        });
      }

      // Tworzymy post w bazie danych
      const createResponse = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: postText.default,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          accountIds: selectedAccounts.map((account) => account.id),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Błąd podczas tworzenia posta");
      }

      const createResult = await createResponse.json();
      const post = createResult.data;

      // Publikujemy post natychmiast
      const publishPromises = selectedAccounts.map(async (account) => {
        const response = await fetch("/api/posts/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: account.provider,
            postId: post.id,
            accountId: account.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Błąd publikacji na ${PLATFORM_NAMES[account.provider]}: ${errorData.error}`,
          );
        }

        return response.json();
      });

      await Promise.all(publishPromises);

      toast.success("Post został opublikowany pomyślnie!");
      resetState();
      onClose();
    } catch (error: unknown) {
      console.error("Publishing error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Wystąpił błąd podczas publikacji posta");
      }
    } finally {
      setIsPublishing(false);
    }
  }, [
    postText.default,
    selectedAccounts,
    selectedFiles,
    isPublishing,
    resetState,
    onClose,
  ]);

  const getAcceptedFileTypes = () => {
    switch (postType) {
      case "images":
        return "image/*";
      case "video":
        return "video/*";
      default:
        return "image/*,video/*";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (contentType.startsWith("video/")) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Card shine cursor
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    el.style.setProperty("--x", `${x}%`);
  };

  return (
    <div className="space-y-6">
      {/* Header with playful accent and primary actions */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100/40 to-transparent dark:via-zinc-800/30 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-inset ring-blue-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-sm sm:text-base">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Finalizuj i publikuj
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300/90">
                Sprawdź treść, media i konta. Możesz wrócić, by coś poprawić.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Wstecz
            </Button>
            <Button
              onClick={handlePublish}
              disabled={
                isPublishing ||
                !postText.default.trim() ||
                selectedAccounts.length === 0 ||
                selectedFiles.length === 0
              }
              className="flex items-center gap-2"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Opublikuj
            </Button>
          </div>
        </div>
      </div>

      {/* Summary / Selected accounts */}
      <div
        onMouseMove={onMouseMove}
        className={`relative overflow-hidden border ${glassPanel} rounded-2xl ${shineOverlay} ${gradientRing}`}
      >
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
              Wybrane konta ({selectedAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedAccounts.map((account) => (
                <span
                  key={account.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${PLATFORM_BADGE_STYLES[account.provider]}`}
                  title={account.displayName || account.username || undefined}
                >
                  {PLATFORM_ICONS[account.provider]}
                  {account.displayName ||
                    account.username ||
                    PLATFORM_NAMES[account.provider]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post content card with shimmering shell */}
      <div
        onMouseMove={onMouseMove}
        className={`relative overflow-hidden border ${glassPanel} rounded-2xl ${shineOverlay} ${gradientRing}`}
      >
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
              Treść posta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              placeholder="Napisz coś..."
              value={postText.default}
              onChange={(e) =>
                setPostText({ ...postText, default: e.target.value })
              }
              className="min-h-[140px] resize-none bg-white/60 dark:bg-zinc-900/40"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {postText.default.length} znaków
              </span>
              <div className="text-xs">
                {postText.default.length > 280 ? (
                  <span className="text-red-600 dark:text-red-400">
                    Przekroczono limit dla Twitter (280)
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Wskazówka: dodaj pytanie lub CTA na końcu
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Media upload card with enhanced drag & drop */}
      {(postType === "images" || postType === "video") && (
        <div
          onMouseMove={onMouseMove}
          className={`relative overflow-hidden border ${glassPanel} rounded-2xl ${shineOverlay} ${gradientRing}`}
        >
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                Media
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptedFileTypes()}
                  onChange={handleFileInputChange}
                  multiple
                  className="hidden"
                />

                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 hover:cursor-pointer ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-500"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600"
                  }`}
                >
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {isDragOver ? (
                        <CloudUpload className="h-6 w-6 text-blue-500" />
                      ) : isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      ) : (
                        <Upload className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {isDragOver
                        ? "Upuść pliki tutaj"
                        : isUploading
                          ? "Przesyłanie plików..."
                          : "Przeciągnij i upuść pliki"}
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                      {postType === "images"
                        ? "Obsługiwane formaty: JPG, PNG, GIF, WebP"
                        : postType === "video"
                          ? "Obsługiwane formaty: MP4, MOV, AVI, WebM"
                          : "Obsługiwane formaty: JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM"}
                      <br />
                      Maksymalny rozmiar: 4MB na plik
                    </p>

                    {isUploading ?? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Przesyłanie...
                      </>
                    )}
                  </div>
                </div>

                {/* File List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Przesłane pliki ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file) => (
                        <div
                          key={file.fileName}
                          className="group relative flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white/60 dark:bg-zinc-900/40 dark:border-zinc-800 hover:bg-white/80 dark:hover:bg-zinc-900/60 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {getFileIcon(file.contentType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatFileSize(file.size)}
                            </p>
                            {uploadProgress[file.fileName] !== undefined && (
                              <div className="mt-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all duration-300"
                                      style={{
                                        width: `${uploadProgress[file.fileName]}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {uploadProgress[file.fileName]}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {uploadProgress[file.fileName] === 100 && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(file.fileName)}
                              className="flex-shrink-0 opacity-80 hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                              aria-label="Usuń plik"
                              title="Usuń"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline underline-offset-2"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}
