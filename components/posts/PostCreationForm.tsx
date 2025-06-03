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
  RotateCcw,
  Info,
  Send,
  User,
  File as FileIcon,
  MessageSquareText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { pl } from "date-fns/locale";
import { useForm, useWatch } from "react-hook-form";
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
import { useAccounts } from "./hooks/useAccounts";
import { useFileProcessing } from "./hooks/useFileProcessing";

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

// --- ANIMOWANE POWIADOMIENIA ---
function useAnimatedNotification(show: boolean, timeout = 350) {
  const [visible, setVisible] = useState(show);
  const [shouldRender, setShouldRender] = useState(show);
  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), timeout);
      return () => clearTimeout(timer);
    }
  }, [show, timeout]);
  return { visible, shouldRender };
}

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

  const {
    accounts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedPlatforms,
    setSelectedPlatforms,
    groupedAccounts,
  } = useAccounts();

  const {
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
  } = useFileProcessing({
    selectedFiles,
    setSelectedFiles,
    isTextOnly,
    loadVideo,
    selectedAccounts: selectedAccounts as SocialAccountWithUsername[],
    postType: postType ?? "",
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      text: postText.default || "",
      scheduledDate: scheduledDate,
    },
    mode: "onChange",
  });

  const watchedText = useWatch({ control: form.control, name: "text" });
  const isTextEmpty = (watchedText || "").length === 0;
  const isFileMissing = !isTextOnly && selectedFiles.length === 0;
  const isAccountMissing = selectedAccounts.length === 0;

  // --- ANIMOWANE POWIADOMIENIA ---
  const fileNotification = useAnimatedNotification(isFileMissing);
  const textNotification = useAnimatedNotification(isTextEmpty);
  const accountNotification = useAnimatedNotification(isAccountMissing);

  // Funkcja dostępnych platform dla wybranego typu posta
  const getAvailablePlatforms = () => {
    const currentPostType = POST_TYPES.find((type) => type.id === postType);
    if (!currentPostType) return AVAILABLE_PLATFORMS;
    return AVAILABLE_PLATFORMS.filter((platform) =>
      currentPostType.platforms.some(
        (p) => p.name.toLowerCase() === platform.name.toLowerCase()
      )
    );
  };

  // Filtrowanie groupedAccounts do tylko dostępnych platform
  const availablePlatformIds = getAvailablePlatforms().map((p) =>
    p.id.toLowerCase()
  );
  const filteredGroupedAccounts = Object.fromEntries(
    Object.entries(groupedAccounts).filter(([platform]) =>
      availablePlatformIds.includes(platform)
    )
  );

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
    if (selectedFiles.length === 0) setSelectedPreviewIndex(0);
    else if (selectedPreviewIndex >= selectedFiles.length)
      setSelectedPreviewIndex(0);
  }, [selectedFiles]);

  const onSubmit = async (data: PostFormValues) => {
    try {
      setIsPublishing(true);
      setContent(data.text);
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
                      new Error(
                        `Nie udało się wrzucić pliku ${file.name} (kod: ${xhr.status}) ${xhr.response}`
                      )
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
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Lewa kolumna: główne sekcje */}
      <div className="flex-1 space-y-8">
        {/* 1. Wybór kont */}
        <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-3">
            <User className="h-5 w-5 text-blue-500" />
            Wybierz konta
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Wybierz konta społecznościowe, na których chcesz opublikować post.
          </p>
          <AccountSelectionSection
            accounts={accounts}
            selectedAccounts={selectedAccounts as SocialAccountWithUsername[]}
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
            groupedAccounts={filteredGroupedAccounts}
            isLoading={isLoading}
          />
        </section>

        {/* 2. Dodaj pliki */}
        {!isTextOnly && (
          <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-3">
              <FileIcon className="h-5 w-5 text-green-500" />
              Dodaj pliki
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Dodaj zdjęcia lub filmy, które chcesz dołączyć do posta.
            </p>
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
          </section>
        )}

        {/* 3 i 4. Treść posta i Data publikacji w jednej linii na desktopie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-3">
              <MessageSquareText className="h-5 w-5 text-purple-500" />
              Treść posta
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Wpisz treść posta. Możesz użyć hashtagów, oznaczeń i emoji.
            </p>
            <PostTextSection
              isTextOnly={isTextOnly}
              form={form}
              selectedAccounts={selectedAccounts as SocialAccountWithUsername[]}
              getAvailablePlatforms={getAvailablePlatforms}
            />
          </section>
          <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm lg:col-span-1 mt-8 lg:mt-0">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-yellow-500" />
              Data publikacji
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Wybierz datę i godzinę, jeśli chcesz zaplanować post. Pozostaw
              puste, aby opublikować od razu.
            </p>
            <div className="flex flex-col gap-5">
              {/* WYBÓR DATY */}
              <div>
                <Label className="text-base font-medium text-gray-900 mb-2 block">
                  Data
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal text-base transition-all duration-200 bg-gray-50 border-gray-200 px-4 py-3 rounded-lg",
                        !form.watch("scheduledDate") && "text-gray-500",
                        form.formState.errors.scheduledDate
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
                      {form.watch("scheduledDate") ? (
                        <span className="font-semibold text-gray-900">
                          {format(form.watch("scheduledDate") as Date, "PPP", {
                            locale: pl,
                          })}
                        </span>
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
                {/* Przycisk wyczyść datę */}
                {form.watch("scheduledDate") && (
                  <button
                    type="button"
                    onClick={() => form.setValue("scheduledDate", undefined)}
                    className="mt-2 text-xs text-blue-600 hover:underline focus:outline-none"
                  >
                    Wyczyść datę
                  </button>
                )}
              </div>
              {/* WYBÓR GODZINY */}
              <div>
                <Label
                  htmlFor="scheduledTime"
                  className="text-base font-medium text-gray-900 mb-2 block"
                >
                  Godzina
                </Label>
                <div className="relative">
                  <Input
                    id="scheduledTime"
                    type="time"
                    className={cn(
                      "w-full h-12 text-base transition-all duration-200 bg-gray-50 border-gray-200 pl-4 pr-10 rounded-lg",
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
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {/* BŁĄD */}
              {form.formState.errors.scheduledDate && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-md animate-fade-in mt-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{form.formState.errors.scheduledDate.message}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Prawa kolumna: podsumowanie i publikacja */}
      <div className="w-full lg:w-[380px] flex-shrink-0 space-y-8">
        <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-md sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Podsumowanie i publikacja
            </h3>
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Info className="h-4 w-4" />
                <span>
                  {scheduledDate
                    ? "Zaplanuj post na wybraną datę i godzinę"
                    : "Opublikuj post natychmiast lub zaplanuj na później"}
                </span>
              </div>
              <div className="space-y-2 min-h-[24px]">
                {/* Dodaj plik */}
                {fileNotification.shouldRender && (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm text-gray-500 transition-opacity duration-300",
                      fileNotification.visible ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <Info className="h-4 w-4" />
                    <span>Dodaj plik, aby opublikować post</span>
                  </div>
                )}
                {/* Dodaj tekst */}
                {textNotification.shouldRender && (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm text-gray-500 transition-opacity duration-300",
                      textNotification.visible ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <Info className="h-4 w-4" />
                    <span>Dodaj tekst posta</span>
                  </div>
                )}
                {/* Wybierz konto */}
                {accountNotification.shouldRender && (
                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm text-gray-500 transition-opacity duration-300",
                      accountNotification.visible ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <Info className="h-4 w-4" />
                    <span>Wybierz przynajmniej jedno konto</span>
                  </div>
                )}
              </div>
            </div>
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
          </form>
          {/* Podgląd obrazów pod podsumowaniem */}
          {!isTextOnly && selectedFiles.length > 0 && (
            <div className="mt-8">
              <ImagePreviewSection
                selectedFiles={selectedFiles}
                selectedPreviewIndex={selectedPreviewIndex}
                setSelectedPreviewIndex={setSelectedPreviewIndex}
                imageLimitWarnings={imageLimitWarnings}
              />
            </div>
          )}
        </section>
      </div>

      {/* Ukryty input do uploadu plików */}
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

      {/* Modale */}
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
