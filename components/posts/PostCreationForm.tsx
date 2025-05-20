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
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Send,
  Search,
  AlertTriangle,
  Trash,
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
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { MAX_FILE_SIZE } from "@/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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
    maxChars: 60000,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <FaInstagram className="h-5 w-5 text-pink-600" />,
    maxChars: 2200,
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: <FaTwitter className="h-5 w-5 text-blue-400" />,
    maxChars: 280,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <FaTiktok className="h-5 w-5 text-black" />,
    maxChars: 2200,
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
    postType,
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
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

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

  useEffect(() => {
    if (selectedFiles.length === 0) setSelectedPreviewIndex(0);
    else if (selectedPreviewIndex >= selectedFiles.length)
      setSelectedPreviewIndex(0);
  }, [selectedFiles]);

  const onSubmit = async (data: PostFormValues) => {
    try {
      setIsPublishing(true);
      setContent(data.text);

      const initialStatus = selectedAccounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        provider: account.provider,
        status: "pending" as const,
      }));

      setPublishingStatus(initialStatus);
      setIsPublishingModalOpen(true);

      // Bezpieczna konwersja plików
      const mediaUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer();
            return {
              data: Array.from(new Uint8Array(arrayBuffer)),
              type: file.type,
              name: file.name,
            };
          } catch (error) {
            console.error("Błąd podczas przetwarzania pliku:", error);
            throw new Error(`Nie udało się przetworzyć pliku ${file.name}`);
          }
        })
      );

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.text,
          mediaUrls,
          accountIds: selectedAccounts.map((account) => account.id),
          scheduledDate: data.scheduledDate,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
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

      const result = await response.json();

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
      console.error("Błąd podczas publikacji:", error);
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

  // Funkcja do obsługi zmiany kolejności zdjęć
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newFiles = Array.from(selectedFiles);
    const [removed] = newFiles.splice(result.source.index, 1);
    newFiles.splice(result.destination.index, 0, removed);
    setSelectedFiles(newFiles);
  };

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
                "border-2 border-dashed rounded-xl bg-gray-50 w-full mx-auto p-4 flex flex-col items-center transition-all duration-300 min-h-[200px]",
                dragActive
                  ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                  : "border-gray-200",
                "hover:border-blue-500 hover:bg-blue-50/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                if (selectedFiles.length === 0) fileInputRef.current?.click();
              }}
              style={{ cursor: "pointer" }}
            >
              {selectedFiles.length > 0 ? (
                <>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable
                      droppableId="images-droppable"
                      direction="horizontal"
                    >
                      {(provided) => (
                        <div
                          className="flex items-center gap-3 overflow-x-auto w-full mb-4 pb-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {selectedFiles.map((file, idx) => (
                            <Draggable
                              key={file.name + idx}
                              draggableId={file.name + idx}
                              index={idx}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "w-24 h-24 flex-shrink-0 rounded-lg cursor-pointer relative group transition-all duration-200 mx-0.5 my-1",
                                    selectedPreviewIndex === idx
                                      ? "ring-2 ring-blue-400 scale-105"
                                      : "hover:scale-105",
                                    snapshot.isDragging &&
                                      "z-50 shadow-lg scale-110"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPreviewIndex(idx);
                                  }}
                                >
                                  <div className="w-full h-full rounded-lg overflow-hidden">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Podgląd ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:text-white hover:bg-red-600 absolute left-1 bottom-1 m-0 p-1"
                                      style={{
                                        position: "absolute",
                                        left: 4,
                                        bottom: 4,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFiles(
                                          selectedFiles.filter(
                                            (_, i) => i !== idx
                                          )
                                        );
                                      }}
                                    >
                                      <Trash className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <div className="flex w-full justify-center gap-3">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Dodaj więcej plików
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFiles([]);
                      }}
                      className="px-6"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Wyczyść wszystkie
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110">
                    <ImageIcon className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="text-2xl font-medium text-gray-900 mb-2">
                    Przeciągnij i upuść pliki
                  </p>
                  <p className="text-base text-gray-600 mb-4">
                    lub kliknij, aby wybrać pliki
                  </p>
                  <div className="text-sm text-gray-500 space-y-3 bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2">
                      <span>Obsługiwane formaty:</span>
                      <span className="font-medium text-gray-700">
                        {getSupportedFormats().join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span>Maksymalny rozmiar pliku:</span>
                      <span className="font-medium text-gray-700">
                        {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB
                      </span>
                    </div>
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
                  {selectedAccounts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <span
                          className={cn(
                            "font-medium",
                            form.watch("text")?.length >
                              Math.min(
                                ...selectedAccounts.map((account) => {
                                  const platform = AVAILABLE_PLATFORMS.find(
                                    (p) =>
                                      p.id === account.provider.toLowerCase()
                                  );
                                  return platform?.maxChars || Infinity;
                                })
                              )
                              ? "text-red-500"
                              : "text-gray-700"
                          )}
                        >
                          {form.watch("text")?.length || 0}
                        </span>
                        <span>/</span>
                        <span className="font-medium text-gray-700">
                          {Math.min(
                            ...selectedAccounts.map((account) => {
                              const platform = AVAILABLE_PLATFORMS.find(
                                (p) => p.id === account.provider.toLowerCase()
                              );
                              return platform?.maxChars || Infinity;
                            })
                          )}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">znaków</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    {...form.register("text")}
                    placeholder={
                      selectedAccounts.length === 0
                        ? "Najpierw wybierz konto, aby dodać tekst..."
                        : "Wpisz tekst posta..."
                    }
                    disabled={selectedAccounts.length === 0}
                    className={cn(
                      "min-h-[120px] text-base resize-none transition-all duration-200 bg-gray-50 border-gray-200",
                      form.formState.errors.text
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500",
                      selectedAccounts.length === 0 &&
                        "cursor-not-allowed opacity-75"
                    )}
                  />
                  {selectedAccounts.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm">
                        <Info className="h-4 w-4" />
                        <span>Wybierz konto, aby dodać tekst</span>
                      </div>
                    </div>
                  )}
                </div>
                {form.formState.errors.text && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md animate-fade-in mt-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{form.formState.errors.text.message}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button
                type="submit"
                disabled={
                  isPublishing ||
                  selectedFiles.length === 0 ||
                  form.watch("text")?.length === 0 ||
                  selectedAccounts.length === 0
                }
                className={cn(
                  "w-full transition-all duration-200",
                  isPublishing ||
                    selectedFiles.length === 0 ||
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
                {selectedFiles.length === 0 && (
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
            <div className="mb-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Podgląd obrazu
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedPreviewIndex + 1} z {selectedFiles.length}
                  </span>
                </div>
                {imageLimitWarnings.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {imageLimitWarnings.map((warning) => (
                      <div
                        key={warning.platform}
                        className="flex items-center gap-2 bg-yellow-100 text-yellow-800 rounded-md px-3 py-2 text-sm"
                      >
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span>
                          Tylko pierwsze <b>{warning.limit}</b> zdjęć zostanie
                          opublikowanych na platformie <b>{warning.name}</b>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg w-full aspect-[4/3] overflow-hidden">
                    {selectedFiles[selectedPreviewIndex] && (
                      <img
                        src={URL.createObjectURL(
                          selectedFiles[selectedPreviewIndex]
                        )}
                        alt="Pełny obraz"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  {selectedFiles.length > 1 && (
                    <div className="flex justify-between items-center gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPreviewIndex((prev) =>
                            prev === 0 ? selectedFiles.length - 1 : prev - 1
                          )
                        }
                        className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6 text-blue-600"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                          />
                        </svg>
                      </button>

                      <div className="flex items-center gap-2">
                        {selectedFiles.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPreviewIndex(index)}
                            className={`h-2 rounded-full transition-all duration-500 ease-in-out transform ${
                              selectedPreviewIndex === index
                                ? "bg-blue-600 w-8 scale-110"
                                : "bg-gray-300 hover:bg-gray-400 w-2 hover:scale-110"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPreviewIndex((prev) =>
                            prev === selectedFiles.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-6 h-6 text-blue-600"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200 sticky top-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Szukaj kont..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                            "text-gray-500 hover:text-gray-700 transition-colors duration-200",
                            selectedPlatforms.includes(platform.id) &&
                              "bg-gray-100 text-gray-900"
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

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {Object.entries(groupedAccounts).map(([platform, accounts]) => (
                <div key={platform} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
                    {AVAILABLE_PLATFORMS.find((p) => p.id === platform)?.icon}
                    {AVAILABLE_PLATFORMS.find((p) => p.id === platform)?.name}
                    <span className="text-xs text-gray-500">
                      ({accounts.length})
                    </span>
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
                          <Avatar className="w-10 h-10">
                            {account.profileImage ? (
                              <Image
                                src={account.profileImage}
                                alt={account.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <AvatarFallback className="text-sm font-medium">
                                {account.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
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
                        ) && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            <span className="text-sm text-blue-500 font-medium">
                              Wybrane
                            </span>
                          </div>
                        )}
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
