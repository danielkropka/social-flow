import { Button } from "@/components/ui/button";
import { usePostCreation } from "@/context/PostCreationContext";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Loader2,
  AlertCircle,
  X,
  RotateCcw,
  Info,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { pl } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PublishingModal } from "@/components/PublishingModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SocialAccountWithUsername } from "@/types";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import {
  MAX_FILE_SIZE,
  SUPPORTED_PLATFORMS,
  PLATFORM_DISPLAY,
} from "@/constants";
import { POST_TYPES } from "./PostTypeSelectionStep";
import { AccountSelectionSection } from "@/components/posts/AccountSelectionSection";
import { FileUploadSection } from "@/components/posts/FileUploadSection";
import { ImagePreviewSection } from "@/components/posts/ImagePreviewSection";
import { PostTextSection } from "@/components/posts/PostTextSection";

const getMinScheduleTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  const minDate = new Date(now);
  minDate.setMinutes(roundedMinutes, 0, 0);
  return minDate;
};

const postSchema = z.object({
  text: z.string().min(1, "Tekst posta nie może być pusty"),
  scheduledDate: z
    .date()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const minTime = getMinScheduleTime();
      return date >= minTime;
    }, "Post musi być zaplanowany minimum 5 minut w przyszłość"),
});

export type PostFormValues = z.infer<typeof postSchema>;

export type MediaUrl = {
  url: string;
  type: string;
  name: string;
};

const AVAILABLE_PLATFORMS = Object.values(SUPPORTED_PLATFORMS).map(
  (platform) => ({
    id: platform,
    name: PLATFORM_DISPLAY[platform].label,
    icon: PLATFORM_DISPLAY[platform].icon,
    maxChars: PLATFORM_DISPLAY[platform].maxChars,
  })
);

export function PostCreationForm() {
  const {
    selectedFiles,
    setSelectedFiles,
    selectedAccounts,
    setSelectedAccounts,
    postText,
    setPostText,
    scheduledDate,
    setScheduledDate,
    setCurrentStep,
    setContent,
    isTextOnly,
    resetState,
    postType,
  } = usePostCreation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loadVideo } = useVideoProcessing({
    onError: (error) => toast.error(error.message),
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<SocialAccountWithUsername[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<MediaUrl[]>([]);

  const getSupportedFormats = () => {
    if (isTextOnly) return [];

    if (postType === "video") {
      return ["MP4", "MOV"];
    } else if (postType === "images") {
      return ["JPG", "PNG"];
    }

    return ["JPG", "PNG", "MP4", "MOV"];
  };

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      text: postText.default || "",
      scheduledDate: scheduledDate,
    },
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.text !== undefined) {
        setPostText({ default: value.text });
      }
      if (value.scheduledDate !== undefined) {
        setScheduledDate(value.scheduledDate);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/accounts");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać połączonych kont");
        }
        const data = await response.json();
        setAccounts(
          (Array.isArray(data) ? data : data.accounts || []).map(
            (acc: SocialAccountWithUsername) => ({
              ...acc,
              provider: acc.provider ?? acc.platform ?? "",
              username: acc.username ?? "",
              providerAccountId: acc.providerAccountId ?? "",
              platform: acc.platform ?? acc.provider ?? "",
              name: acc.name ?? "",
              avatar: acc.avatar ?? "",
              accountType: acc.accountType ?? "",
              id: acc.id,
            })
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
        setAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedFiles.length === 0) setSelectedPreviewIndex(0);
    else if (selectedPreviewIndex >= selectedFiles.length)
      setSelectedPreviewIndex(0);
  }, [selectedFiles]);

  const onSubmit = async (data: PostFormValues) => {
    try {
      setIsPublishing(true);
      setContent(data.text);

      // Upload plików do S3 i zbierz URL-e
      const mediaUrls = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<{ url: string; type: string; name: string }>(
              (resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/media/upload", true);
                xhr.responseType = "json";
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.setRequestHeader(
                  "X-File-Name",
                  encodeURIComponent(file.name)
                );
                xhr.setRequestHeader("X-File-Type", file.type);

                xhr.onload = function () {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    const response =
                      typeof xhr.response === "string"
                        ? JSON.parse(xhr.response)
                        : xhr.response;
                    resolve({
                      url: response.url,
                      type: file.type,
                      name: file.name,
                    });
                  } else {
                    reject(
                      new Error(`Nie udało się wrzucić pliku ${file.name}`)
                    );
                  }
                };

                xhr.onerror = function () {
                  reject(
                    new Error(`Błąd sieci podczas uploadu pliku ${file.name}`)
                  );
                };

                xhr.send(file);
              }
            )
        )
      );

      setMediaUrls(mediaUrls);
      setIsPublishingModalOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd"
      );
      setIsPublishingModalOpen(false);
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    resetState();
    setCurrentStep(1);
    toast.success("Formularz został zresetowany");
  };

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
          `Pliki przekraczają maksymalny rozmiar ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`
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
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const filteredAccounts = (accounts || []).filter(
    (account) =>
      (account.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.provider.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedPlatforms.length === 0 ||
        selectedPlatforms.includes(account.provider.toLowerCase()))
  );

  const groupedAccounts = filteredAccounts.reduce(
    (acc, account) => {
      const platform = account.provider.toLowerCase();
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(account);
      return acc;
    },
    {} as Record<string, SocialAccountWithUsername[]>
  );

  const getAcceptedFileTypes = () => {
    if (isTextOnly) return "";

    if (postType === "video") {
      return ".mp4,.mov";
    } else if (postType === "images") {
      return ".jpg,.jpeg,.png";
    }

    return ".jpg,.jpeg,.png,.mp4,.mov";
  };

  // Limity platform
  const PLATFORM_IMAGE_LIMITS: Record<string, { name: string; limit: number }> =
    {
      twitter: { name: "Twitter", limit: 4 },
      facebook: { name: "Facebook", limit: 20 },
      instagram: { name: "Instagram", limit: 10 },
      tiktok: { name: "TikTok", limit: 35 },
    };

  // Zbierz limity dla wybranych platform
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

  const getAvailablePlatforms = () => {
    const currentPostType = POST_TYPES.find((type) => type.id === postType);
    if (!currentPostType) return AVAILABLE_PLATFORMS;
    return AVAILABLE_PLATFORMS.filter((platform) =>
      currentPostType.platforms.some(
        (p) => p.name.toLowerCase() === platform.name.toLowerCase()
      )
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <p className="text-red-500 font-medium">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            Tworzenie posta
          </h2>
          <p className="text-gray-600 text-sm">
            {scheduledDate
              ? "Zaplanuj post na wybraną datę i godzinę"
              : "Opublikuj post natychmiast lub zaplanuj na później"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(true)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pomoc i wskazówki</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resetuj formularz</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!isTextOnly && (
            <FileUploadSection
              dragActive={dragActive}
              setDragActive={setDragActive}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              selectedPreviewIndex={selectedPreviewIndex}
              setSelectedPreviewIndex={setSelectedPreviewIndex}
              fileInputRef={fileInputRef}
              processFiles={processFiles}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              getSupportedFormats={getSupportedFormats}
              MAX_FILE_SIZE={MAX_FILE_SIZE}
            />
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <PostTextSection
              isTextOnly={isTextOnly}
              form={form}
              selectedAccounts={selectedAccounts as SocialAccountWithUsername[]}
              getAvailablePlatforms={getAvailablePlatforms}
            />

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button
                type="submit"
                disabled={
                  isPublishing ||
                  (!isTextOnly && selectedFiles.length === 0) ||
                  form.watch("text")?.length === 0 ||
                  selectedAccounts.length === 0
                }
                className={cn(
                  "w-full transition-all duration-200",
                  isPublishing ||
                    (!isTextOnly && selectedFiles.length === 0) ||
                    form.watch("text")?.length === 0 ||
                    selectedAccounts.length === 0
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {scheduledDate ? "Planowanie..." : "Publikowanie..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {scheduledDate ? "Zaplanuj post" : "Opublikuj post"}
                  </>
                )}
              </Button>
              <div className="mt-3 space-y-2">
                {!isTextOnly && selectedFiles.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info className="h-4 w-4" />
                    <span>Dodaj plik, aby opublikować post</span>
                  </div>
                )}
                {form.watch("text")?.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info className="h-4 w-4" />
                    <span>Dodaj tekst posta</span>
                  </div>
                )}
                {selectedAccounts.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info className="h-4 w-4" />
                    <span>Wybierz przynajmniej jedno konto</span>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {!isTextOnly && selectedFiles.length > 0 && (
            <ImagePreviewSection
              selectedFiles={selectedFiles}
              selectedPreviewIndex={selectedPreviewIndex}
              setSelectedPreviewIndex={setSelectedPreviewIndex}
              imageLimitWarnings={imageLimitWarnings}
            />
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200 sticky top-6">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <AccountSelectionSection
                accounts={accounts}
                selectedAccounts={
                  selectedAccounts as SocialAccountWithUsername[]
                }
                setSelectedAccounts={
                  setSelectedAccounts as (
                    accounts: SocialAccountWithUsername[]
                  ) => void
                }
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedPlatforms={selectedPlatforms}
                setSelectedPlatforms={setSelectedPlatforms}
                getAvailablePlatforms={getAvailablePlatforms}
                groupedAccounts={groupedAccounts}
                isLoading={isLoading}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium text-gray-900">
                  Data publikacji
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    form.setValue("scheduledDate", undefined);
                  }}
                  className={cn(
                    "text-gray-500 hover:text-gray-700",
                    !form.watch("scheduledDate") && "hidden"
                  )}
                >
                  <X className="h-4 w-4 mr-1" />
                  Wyczyść datę
                </Button>
              </div>
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base transition-all duration-200 bg-gray-50 border-gray-200",
                        !form.watch("scheduledDate") && "text-gray-500",
                        form.formState.errors.scheduledDate
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("scheduledDate") ? (
                        format(form.watch("scheduledDate") as Date, "PPP", {
                          locale: pl,
                        })
                      ) : (
                        <span>Wybierz datę</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("scheduledDate")}
                      onSelect={(date) => {
                        if (date) {
                          const now = new Date();
                          const today = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate()
                          );
                          const selectedDate = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate()
                          );

                          if (selectedDate.getTime() === today.getTime()) {
                            const minTime = getMinScheduleTime();
                            form.setValue("scheduledDate", minTime);
                          } else {
                            date.setHours(12, 0, 0, 0);
                            form.setValue("scheduledDate", date);
                          }
                        } else {
                          form.setValue("scheduledDate", undefined);
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        return (
                          date <
                          new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate()
                          )
                        );
                      }}
                      initialFocus
                      locale={pl}
                    />
                  </PopoverContent>
                </Popover>

                <div className="relative">
                  <Input
                    type="time"
                    className={cn(
                      "text-base transition-all duration-200 bg-gray-50 border-gray-200",
                      form.formState.errors.scheduledDate
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    value={
                      form.watch("scheduledDate")
                        ? format(form.watch("scheduledDate") as Date, "HH:mm")
                        : ""
                    }
                    onChange={(e) => {
                      const date = form.watch("scheduledDate") || new Date();
                      const [hours, minutes] = e.target.value.split(":");
                      const newDate = new Date(date);
                      newDate.setHours(
                        parseInt(hours),
                        parseInt(minutes),
                        0,
                        0
                      );
                      form.setValue("scheduledDate", newDate);
                    }}
                    disabled={!form.watch("scheduledDate")}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {form.formState.errors.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md animate-fade-in">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{form.formState.errors.scheduledDate.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={
          !isTextOnly &&
          !selectedFiles.some((file) => file.type.startsWith("video/"))
        }
        accept={getAcceptedFileTypes()}
        className="hidden"
        onChange={(e) => processFiles(Array.from(e.target.files || []))}
      />

      <PublishingModal
        isOpen={isPublishingModalOpen}
        onClose={() => {
          setIsPublishingModalOpen(false);
        }}
        accounts={selectedAccounts}
        content={form.watch("text")}
        mediaUrls={mediaUrls}
      />

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Resetuj formularz
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Czy na pewno chcesz zresetować formularz? Wszystkie wprowadzone
              dane zostaną utracone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
            >
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Resetuj
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900">
              Pomoc i wskazówki
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              Dowiedz się więcej o tworzeniu i publikacji postów
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-50 p-3">
                  <CalendarIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Planowanie postów
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Możesz zaplanować post na dowolną datę i godzinę w
                      przyszłości. Minimalny czas planowania to 5 minut od
                      teraz.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-3 text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Info className="h-4 w-4 text-blue-500" />
                      Wskazówki dotyczące planowania
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Minimalny czas planowania to 5 minut od teraz
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="p-2 rounded-lg bg-green-50">
                          <CalendarIcon className="h-5 w-5 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Możesz zaplanować post na dowolną datę w przyszłości
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <Send className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Natychmiastowa publikacja
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Jeśli nie wybierzesz daty, post zostanie opublikowany
                      natychmiast po zatwierdzeniu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-purple-50 p-3">
                  <AlertCircle className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Obsługa błędów
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      W przypadku problemów z publikacją, otrzymasz szczegółowe
                      informacje o błędzie dla każdego konta.
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-3 text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Info className="h-4 w-4 text-purple-500" />
                      Co robić w przypadku błędu?
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="p-2 rounded-lg bg-red-50">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Sprawdź komunikat błędu dla każdego konta
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="p-2 rounded-lg bg-yellow-50">
                          <RotateCcw className="h-5 w-5 text-yellow-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Spróbuj ponownie po rozwiązaniu problemu
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
