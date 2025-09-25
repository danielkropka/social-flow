import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  X,
  Send,
  Image as ImageIcon,
  Video,
  FileText,
  Eye,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  Play,
} from "lucide-react";
import { SiTiktok, SiFacebook, SiX, SiInstagram } from "react-icons/si";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";
import { UploadedFileData } from "@/types";
import Image from "next/image";

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

export default function PublishPost() {
  const {
    postType,
    selectedFiles,
    selectedAccounts,
    postText,
    setSelectedFiles,
    setPostText,
    setCurrentStep,
  } = usePostCreation();

  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPlatforms = Array.from(
    new Set(selectedAccounts.map((account) => account.provider)),
  ) as string[];

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Sprawdź czy już trwa upload - zapobiega wielokrotnym wywołaniom
      if (isUploading) {
        console.warn("Upload already in progress, skipping...");
        return;
      }

      setIsUploading(true);

      try {
        const uploadPromises = files.map(
          async (file: File): Promise<UploadedFileData> => {
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

            const result = await response.json();

            if (!result.url) {
              throw new Error(`Brak URL w odpowiedzi dla pliku ${file.name}`);
            }

            return {
              file: file,
              url: result.url,
              fileName: result.fileName,
              contentType: result.fileType,
              size: result.fileSize,
            };
          },
        );

        const uploadResults = await Promise.all(uploadPromises);

        const newFiles = [...selectedFiles, ...uploadResults];
        setSelectedFiles(newFiles);

        toast.success(`Pomyślnie przesłano plik/i.`);
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          switch (error.message) {
            case "TooManyRequests":
              toast.error(
                "Zbyt wiele prób uploadu mediów. Spróbuj ponownie za godzinę.",
              );
              break;
            case "FileTooLarge":
              toast.error("Plik jest za duży. Maksymalny rozmiar to 4MB.");
              break;
            case "InvalidFileType":
              toast.error("Nieobsługiwany format pliku. Wybierz inny plik.");
              break;
            case "NoFile":
              toast.error("Dodaj plik i spróbuj ponownie.");
              break;
            default:
              toast.error("Wystąpił nieznany błąd podczas przesyłania plików");
          }
        }
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [selectedFiles, setSelectedFiles, isUploading],
  );

  const removeFile = useCallback(
    async (index: number) => {
      const fileToRemove = selectedFiles[index];
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);

      // Opcjonalnie: możemy dodać endpoint do usuwania plików z AWS S3
      // jeśli plik ma fileName (został przesłany na S3), możemy go usunąć
      if (fileToRemove && "fileName" in fileToRemove && fileToRemove.fileName) {
        try {
          // TODO: Dodać endpoint do usuwania plików z S3
          // await fetch(`/api/media/delete/${fileToRemove.fileName}`, { method: 'DELETE' });
          console.log(
            `Plik ${fileToRemove.fileName} został usunięty z listy (usunięcie z S3 można dodać później)`,
          );
        } catch (error) {
          console.error("Error removing file from S3:", error);
          // Nie pokazujemy błędu użytkownikowi, bo plik został już usunięty z listy
        }
      }
    },
    [selectedFiles, setSelectedFiles],
  );

  const handleTextChange = useCallback(
    (platform: string, text: string) => {
      if (platform === "default") {
        setPostText({ ...postText, default: text });
      } else {
        setCustomTexts({ ...customTexts, [platform]: text });
      }
    },
    [postText, setPostText, customTexts],
  );

  const getTextForPlatform = useCallback(
    (platform: string) => {
      if (platform === "default") return postText.default;
      return customTexts[platform] || postText.default;
    },
    [postText.default, customTexts],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!postText.default.trim()) {
      newErrors.text = "Tekst posta jest wymagany";
    }

    if (postType !== "text" && selectedFiles.length === 0) {
      newErrors.media = `Dodaj ${postType === "images" ? "zdjęcia" : "film"} do posta`;
    }

    if (postType === "images" && selectedFiles.length > 20) {
      newErrors.media = "Maksymalnie 20 zdjęć na post";
    }

    if (selectedAccounts.length === 0) {
      newErrors.accounts = "Wybierz przynajmniej jedno konto";
    }

    return Object.keys(newErrors).length === 0;
  }, [postType, selectedFiles, postText.default, selectedAccounts]);

  const isFormValid = useMemo(() => {
    const newErrors: Record<string, string> = {};

    if (!postText.default.trim()) {
      newErrors.text = "Tekst posta jest wymagany";
    }

    if (postType !== "text" && selectedFiles.length === 0) {
      newErrors.media = `Dodaj ${postType === "images" ? "zdjęcia" : "film"} do posta`;
    }

    if (postType === "images" && selectedFiles.length > 20) {
      newErrors.media = "Maksymalnie 20 zdjęć na post";
    }

    if (selectedAccounts.length === 0) {
      newErrors.accounts = "Wybierz przynajmniej jedno konto";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [postType, selectedFiles, postText.default, selectedAccounts]);

  const handlePublish = useCallback(async () => {
    if (!validateForm()) return;

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
        const publishResponse = await fetch("/api/posts/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: post.id,
            provider: account.provider.toLowerCase(),
            accountId: account.id,
          }),
        });

        const publishData = await publishResponse.json();

        if (!publishResponse.ok) {
          throw new Error(
            `Błąd publikacji na ${account.provider}: ${publishData.error || publishData.message}`,
          );
        }

        // Sprawdź czy publikacja rzeczywiście się powiodła
        if (!publishData.success) {
          throw new Error(
            `Publikacja na ${account.provider} nie powiodła się: ${publishData.message}`,
          );
        }

        return publishData;
      });

      const publishResults = await Promise.all(publishPromises);

      // Resetujemy formularz i wracamy do pierwszego kroku
      setCurrentStep(1);

      // Pokazujemy komunikat o sukcesie tylko jeśli wszystkie publikacje się powiodły
      toast.success("Post został pomyślnie opublikowany!", {
        description: `Opublikowano na ${publishResults.length} platformach`,
      });
    } catch (error) {
      console.error("Error publishing post:", error);

      let errorMessage = "Wystąpił błąd podczas publikacji posta";
      if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) {
          errorMessage = "Brak autoryzacji. Zaloguj się ponownie.";
        } else if (error.message.includes("Nie wszystkie wybrane konta")) {
          errorMessage =
            "Niektóre konta społecznościowe nie są aktywne. Sprawdź status swoich kont.";
        } else if (
          error.message.includes("Token dostępu wygasł") ||
          error.message.includes("TOKEN_EXPIRED")
        ) {
          errorMessage =
            "Token dostępu wygasł. Przejdź do sekcji 'Połączone konta' i połącz konto ponownie.";
        } else if (error.message.includes("Twitter")) {
          errorMessage =
            "Błąd publikacji na Twitter/X. Sprawdź czy konto jest aktywne i ma odpowiednie uprawnienia.";
        } else if (error.message.includes("Instagram")) {
          errorMessage = "Publikacja na Instagramie nie jest jeszcze dostępna.";
        } else if (error.message.includes("Facebook")) {
          errorMessage = "Publikacja na Facebooku nie jest jeszcze dostępna.";
        } else if (error.message.includes("TikTok")) {
          errorMessage = "Publikacja na TikToku nie jest jeszcze dostępna.";
        } else if (error.message.includes("ECONNREFUSED")) {
          errorMessage =
            "Brak połączenia z serwerem. Sprawdź połączenie internetowe.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  }, [
    validateForm,
    postType,
    selectedFiles,
    selectedAccounts,
    postText,
    customTexts,
    setCurrentStep,
    isPublishing,
  ]);

  const getFileType = (
    fileData: UploadedFileData,
  ): "image" | "video" | "unknown" => {
    const fileType = fileData.contentType;

    if (fileType?.startsWith("image/")) return "image";
    if (fileType?.startsWith("video/")) return "video";
    return "unknown";
  };

  const formatFileSize = (fileData: UploadedFileData): string => {
    const bytes = fileData.size;

    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getMaxFiles = () => {
    switch (postType) {
      case "images":
        return 20;
      case "video":
        return 1;
      default:
        return 0;
    }
  };

  const getAcceptedFileTypes = () => {
    switch (postType) {
      case "images":
        return "image/*";
      case "video":
        return "video/*";
      default:
        return "";
    }
  };

  return (
    <section className="w-full">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Finalizuj publikację
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Dodaj treść, media i zaplanuj publikację na wybranych kontach.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input */}
          <Card className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Treść posta
              </CardTitle>
              <CardDescription>
                Napisz treść, która zostanie opublikowana na wszystkich
                wybranych kontach.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Napisz coś..."
                  value={postText.default}
                  onChange={(e) => handleTextChange("default", e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                {errors.text && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.text}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {postText.default.length} znaków
                </p>
              </div>

              {/* Platform-specific text customization */}
              {selectedPlatforms.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dostosuj tekst dla platform
                  </h4>
                  {selectedPlatforms.map((platform: string) => {
                    const platformName = PLATFORM_NAMES[platform] || platform;
                    const platformIcon = PLATFORM_ICONS[platform];
                    const platformStyle = PLATFORM_BADGE_STYLES[platform];

                    return (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                              "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                              platformStyle ??
                                "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                            ].join(" ")}
                          >
                            {platformIcon}
                            {platformName}
                          </span>
                        </div>
                        <Textarea
                          placeholder={`Tekst dla ${platformName} (opcjonalnie)`}
                          value={getTextForPlatform(platform)}
                          onChange={(e) =>
                            handleTextChange(platform, e.target.value)
                          }
                          className="min-h-[80px] resize-none text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          {postType !== "text" && (
            <Card className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {postType === "images" ? (
                    <ImageIcon className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                  {postType === "images" ? "Zdjęcia" : "Film"}
                </CardTitle>
                <CardDescription>
                  {postType === "images"
                    ? "Dodaj do 20 zdjęć do swojego posta"
                    : "Dodaj film do swojego posta"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div
                  className={[
                    "relative border-2 border-dashed rounded-lg p-6 transition-colors",
                    "border-zinc-300 dark:border-zinc-700",
                    "hover:border-zinc-400 dark:hover:border-zinc-600",
                    "bg-zinc-50/50 dark:bg-zinc-800/50",
                  ].join(" ")}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={postType === "images"}
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <div className="text-center">
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Przesyłanie...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Kliknij aby przesłać{" "}
                            {postType === "images" ? "zdjęcia" : "film"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            lub przeciągnij i upuść pliki tutaj
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {errors.media && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.media}
                  </p>
                )}

                {/* File List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Przesłane pliki ({selectedFiles.length}/{getMaxFiles()})
                        {failedImages.size > 0 && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                            ({failedImages.size} nieudanych)
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            // Usuwamy wszystkie pliki z listy
                            setSelectedFiles([]);
                            setFailedImages(new Set());

                            // Opcjonalnie: możemy dodać usuwanie wszystkich plików z S3
                            // const deletePromises = selectedFiles
                            //   .filter(file => file.fileName)
                            //   .map(file => fetch(`/api/media/delete/${file.fileName}`, { method: 'DELETE' }));
                            // await Promise.all(deletePromises);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Usuń wszystkie
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {selectedFiles.map(
                        (fileData: UploadedFileData, index) => {
                          const fileType = getFileType(fileData);
                          const isImage = fileType === "image";
                          const isVideo = fileType === "video";

                          return (
                            <div key={index} className="space-y-2">
                              <div className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                {isImage ? (
                                  <Image
                                    src={fileData.url}
                                    alt={`Preview ${index + 1}`}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover"
                                  />
                                ) : isVideo ? (
                                  <div className="relative w-full h-full">
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Video className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-black/50 rounded-full p-2">
                                        <Play className="h-6 w-6 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}

                                {/* File info overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                  <div className="text-white text-xs">
                                    <p className="font-medium truncate">
                                      {fileData.fileName}
                                    </p>
                                    <p>{formatFileSize(fileData)}</p>
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => removeFile(index)}
                                    className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                    title="Usuń plik"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Accounts Summary */}
          <Card className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Wybrane konta
              </CardTitle>
              <CardDescription>
                Post zostanie opublikowany na następujących kontach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.accounts && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.accounts}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedAccounts.map((account) => {
                  const platformName =
                    PLATFORM_NAMES[account.provider] || account.provider;
                  const platformIcon = PLATFORM_ICONS[account.provider];
                  const platformStyle = PLATFORM_BADGE_STYLES[account.provider];

                  return (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-800/50"
                    >
                      <div
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                          "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                        ].join(" ")}
                      >
                        {platformIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {account.displayName ||
                            account.username ||
                            platformName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {account.username && account.displayName
                            ? `@${account.username}`
                            : platformName}
                        </p>
                      </div>
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                          platformStyle ??
                            "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                        ].join(" ")}
                      >
                        {platformIcon}
                        {platformName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Podgląd posta
              </CardTitle>
              <CardDescription>
                Zobacz jak będzie wyglądać twój post.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock Social Media Post */}
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Twój profil
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      teraz
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                    {postText.default || "Brak tekstu"}
                  </p>
                </div>

                {/* Media Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3">
                    {postType === "images" ? (
                      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                        {selectedFiles.slice(0, 4).map((fileData, index) => {
                          const fileType = getFileType(fileData);
                          const isImage = fileType === "image";

                          // Określamy URL obrazu
                          let imageUrl: string;
                          if ("url" in fileData) {
                            // UploadedFileData
                            imageUrl = fileData.url;
                          } else {
                            // File object
                            imageUrl = URL.createObjectURL(fileData as File);
                          }

                          return (
                            <div
                              key={index}
                              className="aspect-square bg-gray-100 dark:bg-zinc-800"
                            >
                              {isImage ? (
                                <img
                                  src={imageUrl}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {selectedFiles.length > 4 && (
                          <div className="aspect-square bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              +{selectedFiles.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Video className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Platform indicators */}
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map((platform: string) => {
                  const platformName = PLATFORM_NAMES[platform] || platform;
                  const platformIcon = PLATFORM_ICONS[platform];
                  const platformStyle = PLATFORM_BADGE_STYLES[platform];

                  return (
                    <span
                      key={platform}
                      className={[
                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                        "shadow-sm",
                        platformStyle ??
                          "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                      ].join(" ")}
                    >
                      {platformIcon}
                      {platformName}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Publish Button */}
          <Card className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur">
            <CardContent className="pt-6">
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !isFormValid}
                className="w-full"
                size="lg"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publikowanie...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Opublikuj teraz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
