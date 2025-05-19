import { Button } from "@/components/ui/button";
import { usePostCreation } from "@/context/PostCreationContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
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
import { FaTwitter, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConnectedAccount } from "@prisma/client";
import { MediaPreview } from "@/components/MediaPreview";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { MAX_FILE_SIZE } from "@/constants";

interface ConnectedAccountWithDetails extends ConnectedAccount {
  accountType?: string;
}

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

type PostFormValues = z.infer<typeof postSchema>;

const AVAILABLE_PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook",
    icon: <FaFacebook className="h-5 w-5 text-blue-600" />,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <FaInstagram className="h-5 w-5 text-pink-600" />,
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: <FaTwitter className="h-5 w-5 text-blue-400" />,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <FaTiktok className="h-5 w-5 text-black" />,
  },
];

export function PostCreationForm({ onPublish }: { onPublish: () => void }) {
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
    content,
    resetState,
  } = usePostCreation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { loadVideo } = useVideoProcessing({
    onError: (error) => toast.error(error.message),
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<
    Array<{
      accountId: string;
      accountName: string;
      provider: string;
      status: "pending" | "success" | "error";
      error?: string;
    }>
  >([]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accounts, setAccounts] = useState<ConnectedAccountWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      text: postText.default || "",
      scheduledDate: scheduledDate,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (postText.default) {
      form.setValue("text", postText.default);
    }
    if (scheduledDate) {
      form.setValue("scheduledDate", scheduledDate);
    }
  }, [postText.default, scheduledDate, form]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/accounts");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać połączonych kont");
        }
        const data = await response.json();
        setAccounts(Array.isArray(data) ? data : data.accounts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
        setAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const onSubmit = async (data: PostFormValues) => {
    try {
      setIsPublishing(true);
      setPostText({ default: data.text });
      setContent(data.text);
      setScheduledDate(data.scheduledDate);

      const initialStatus = selectedAccounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        provider: account.provider,
        status: "pending" as const,
      }));

      setPublishingStatus(initialStatus);
      setIsPublishingModalOpen(true);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.text,
          mediaUrls: await Promise.all(
            selectedFiles.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              return {
                data: Array.from(new Uint8Array(arrayBuffer)),
                type: file.type,
              };
            })
          ),
          accountIds: selectedAccounts.map((account) => account.id),
          scheduledDate: data.scheduledDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.details ||
          result.error ||
          "Wystąpił błąd podczas publikacji posta";

        setPublishingStatus((prev) =>
          prev.map((status) => ({
            ...status,
            status: "error",
            error: errorMessage,
          }))
        );

        toast.error(errorMessage);
        return;
      }

      if (result.results) {
        setPublishingStatus((prev) =>
          prev.map((status) => {
            const platformResult = result.results.find(
              (r: { accountId: string; success: boolean; error?: string }) =>
                r.accountId === status.accountId
            );
            return {
              ...status,
              status: platformResult?.success ? "success" : "error",
              error: platformResult?.error,
            };
          })
        );
      }

      const successMessage = data.scheduledDate
        ? "Post został zaplanowany pomyślnie"
        : "Post został opublikowany pomyślnie";

      toast.success(successMessage);
      resetState();
      onPublish();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nieznany błąd";

      setPublishingStatus((prev) =>
        prev.map((status) => ({
          ...status,
          status: "error",
          error: errorMessage,
        }))
      );

      toast.error("Wystąpił błąd podczas publikacji posta");
    } finally {
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

      if (!isTextOnly && hasVideos && hasImages) {
        throw new Error("Nie można dodać jednocześnie zdjęć i filmów");
      }

      if (hasVideos && files.length > 1) {
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

      setSelectedFiles(files);

      if (hasVideos) {
        await loadVideo(files[0]);
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

  const handleAccountSelection = (account: ConnectedAccountWithDetails) => {
    const isSelected = selectedAccounts.some(
      (selected) => selected.id === account.id
    );

    if (isSelected) {
      setSelectedAccounts(
        selectedAccounts.filter((selected) => selected.id !== account.id)
      );
    } else {
      setSelectedAccounts([
        ...selectedAccounts,
        {
          id: account.id,
          name: account.name,
          provider: account.provider,
          username: account.username,
        },
      ]);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const filteredAccounts = (accounts || []).filter(
    (account) =>
      (account.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.provider.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedPlatforms.length === 0 ||
        selectedPlatforms.includes(account.provider.toLowerCase()))
  );

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    const platform = account.provider.toLowerCase();
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(account);
    return acc;
  }, {} as Record<string, ConnectedAccountWithDetails[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-600 font-medium">
            Ładowanie połączonych kont...
          </p>
        </div>
      </div>
    );
  }

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
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 transition-all duration-300",
                "border-gray-200 bg-gray-50 hover:border-blue-500 hover:bg-blue-50/50",
                "cursor-pointer",
                dragActive && "border-blue-500 bg-blue-50/50 scale-[1.02]"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="aspect-square relative group">
                      <MediaPreview
                        file={file}
                        className="w-full h-full object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFiles = [...selectedFiles];
                          newFiles.splice(index, 1);
                          setSelectedFiles(newFiles);
                          toast.success("Plik został usunięty");
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110">
                      <ImageIcon className="w-10 h-10 text-blue-500" />
                    </div>
                    <p className="text-2xl font-medium text-gray-900 mb-2">
                      Przeciągnij i upuść pliki
                    </p>
                    <p className="text-base text-gray-600">
                      lub kliknij, aby wybrać pliki
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 space-y-3 bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
                    <p className="flex items-center justify-center gap-2">
                      <span>Obsługiwane formaty:</span>
                      <span className="font-medium text-gray-700">
                        JPG, PNG, MP4
                      </span>
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <span>Maksymalny rozmiar pliku:</span>
                      <span className="font-medium text-gray-700">
                        {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            {isTextOnly ? (
              <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium text-gray-900">
                    Tekst posta
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Edytuj tekst
                  </Button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <Label
                    htmlFor="text"
                    className="text-base font-medium text-gray-900"
                  >
                    Tekst posta
                  </Label>
                  <span className="text-sm text-gray-500">
                    {form.watch("text")?.length || 0} znaków
                  </span>
                </div>
                <Textarea
                  {...form.register("text")}
                  placeholder="Wpisz tekst posta..."
                  className={cn(
                    "min-h-[120px] text-base resize-none transition-all duration-200 bg-gray-50 border-gray-200",
                    form.formState.errors.text
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  )}
                />
                {form.formState.errors.text && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md animate-fade-in mt-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{form.formState.errors.text.message}</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200 sticky top-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Szukaj kont..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                {AVAILABLE_PLATFORMS.map((platform) => (
                  <TooltipProvider key={platform.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlatformToggle(platform.id)}
                          className={cn(
                            "text-gray-500 hover:text-gray-700",
                            selectedPlatforms.includes(platform.id) &&
                              "bg-gray-100"
                          )}
                        >
                          {platform.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{platform.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {Object.entries(groupedAccounts).map(([platform, accounts]) => (
                <div key={platform} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {AVAILABLE_PLATFORMS.find((p) => p.id === platform)?.icon}
                    {AVAILABLE_PLATFORMS.find((p) => p.id === platform)?.name}
                  </h3>
                  <div className="grid gap-2">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handleAccountSelection(account)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
                          selectedAccounts.some(
                            (selected) => selected.id === account.id
                          )
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">
                            {account.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{account.username}
                          </p>
                        </div>
                        {selectedAccounts.some(
                          (selected) => selected.id === account.id
                        ) && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="w-full hover:bg-gray-50 transition-colors duration-200"
                  >
                    Wstecz
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                  >
                    Resetuj
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPublishing}
                    className={cn(
                      "w-full transition-all duration-200",
                      isPublishing
                        ? "opacity-75 cursor-not-allowed"
                        : "hover:shadow-md"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!form.formState.isValid) {
                        form.trigger();
                        return;
                      }
                      form.handleSubmit(onSubmit)(e);
                    }}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {scheduledDate ? "Planowanie..." : "Publikowanie..."}
                      </>
                    ) : scheduledDate ? (
                      "Zaplanuj post"
                    ) : (
                      "Opublikuj post"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={!isTextOnly}
        accept={isTextOnly ? "" : "image/*,video/*"}
        className="hidden"
        onChange={(e) => processFiles(Array.from(e.target.files || []))}
      />

      <PublishingModal
        isOpen={isPublishingModalOpen}
        onClose={() => {
          setIsPublishingModalOpen(false);
        }}
        publishingStatus={publishingStatus}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Pomoc i wskazówki
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Oto kilka przydatnych informacji o publikacji postów:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Planowanie postów
              </h4>
              <p className="text-sm text-blue-700">
                Możesz zaplanować post na dowolną datę i godzinę w przyszłości.
                Minimalny czas planowania to 5 minut od teraz.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Natychmiastowa publikacja
              </h4>
              <p className="text-sm text-green-700">
                Jeśli nie wybierzesz daty, post zostanie opublikowany
                natychmiast po zatwierdzeniu.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">
                Obsługa błędów
              </h4>
              <p className="text-sm text-purple-700">
                W przypadku problemów z publikacją, otrzymasz szczegółowe
                informacje o błędzie dla każdego konta.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
