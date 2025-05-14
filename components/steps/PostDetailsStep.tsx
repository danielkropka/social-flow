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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { pl } from "date-fns/locale";
import { MediaCarousel } from "@/components/MediaCarousel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PublishingModal } from "@/components/PublishingModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";

const getMinScheduleTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  const minDate = new Date(now);
  minDate.setMinutes(roundedMinutes, 0, 0);
  return minDate;
};

// Schemat walidacji
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

export function PostDetailsStep({ onPublish }: { onPublish: () => void }) {
  const {
    selectedFiles,
    mediaUrls,
    selectedAccounts,
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

  const onSubmit = async (data: PostFormValues) => {
    try {
      setIsPublishing(true);
      setPostText({ default: data.text });
      setContent(data.text);
      setScheduledDate(data.scheduledDate);

      // Inicjalizacja statusu publikacji dla każdego konta
      const initialStatus = selectedAccounts.map((account) => ({
        accountId: account.id,
        accountName: account.name,
        provider: account.provider,
        status: "pending" as const,
      }));

      setPublishingStatus(initialStatus);
      setIsPublishingModalOpen(true);

      // Wysyłanie posta do API
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.text,
          mediaUrls: mediaUrls.map((url) => ({
            url,
            thumbnailUrl: null,
          })),
          accountIds: selectedAccounts.map((account) => account.id),
          scheduledDate: data.scheduledDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Aktualizacja statusu publikacji w przypadku błędu
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
        } else {
          setPublishingStatus((prev) =>
            prev.map((status) => ({
              ...status,
              status: "error" as const,
              error: result.details || result.error || "Nieznany błąd",
            }))
          );
        }

        toast.error(
          result.details ||
            result.error ||
            "Wystąpił błąd podczas publikacji posta"
        );
        setIsPublishing(false);
        return;
      }

      // Aktualizacja statusu publikacji na podstawie wyników
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

      toast.success(
        data.scheduledDate
          ? "Post został zaplanowany pomyślnie"
          : "Post został opublikowany pomyślnie"
      );

      setIsPublishing(false);
      resetState();
      onPublish();
    } catch (error) {
      // Aktualizacja statusu publikacji w przypadku błędu
      setPublishingStatus((prev) =>
        prev.map((status) => ({
          ...status,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Nieznany błąd",
        }))
      );

      toast.error("Wystąpił błąd podczas publikacji posta");
      setIsPublishing(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "TWITTER":
        return <FaTwitter className="h-5 w-5 text-blue-400" />;
      case "FACEBOOK":
        return <FaFacebook className="h-5 w-5 text-blue-600" />;
      case "INSTAGRAM":
        return <FaInstagram className="h-5 w-5 text-pink-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: "pending" | "success" | "error") => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {!isTextOnly && (
        <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">Wybrane pliki</p>
            <span className="text-xs text-gray-500">
              {selectedFiles.length} plików
            </span>
          </div>
          <MediaCarousel files={selectedFiles} urls={mediaUrls} />
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Szczegóły posta
        </h2>
        <p className="text-gray-500 text-sm">
          {scheduledDate
            ? "Zaplanuj post na wybraną datę i godzinę"
            : "Opublikuj post natychmiast lub zaplanuj na później"}
        </p>
      </div>

      <PublishingModal
        isOpen={isPublishingModalOpen}
        onClose={() => {
          setIsPublishingModalOpen(false);
        }}
        publishingStatus={publishingStatus}
      />

      <Dialog
        open={isPublishingModalOpen}
        onOpenChange={setIsPublishingModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status publikacji</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {publishingStatus.map((status) => (
              <div
                key={status.accountId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getProviderIcon(status.provider)}
                  <div>
                    <p className="font-medium">{status.accountName}</p>
                    <p className="text-sm text-gray-500">{status.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status.status === "pending" && (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      getStatusColor(status.status)
                    )}
                  >
                    {status.status === "pending" && "Publikowanie..."}
                    {status.status === "success" && "Opublikowano"}
                    {status.status === "error" && "Błąd"}
                  </span>
                </div>
              </div>
            ))}
            {publishingStatus.some((status) => status.status === "error") && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-700 mb-2">
                  Szczegóły błędów:
                </h4>
                {publishingStatus
                  .filter((status) => status.status === "error")
                  .map((status) => (
                    <div
                      key={status.accountId}
                      className="text-sm text-red-600"
                    >
                      <p className="font-medium">{status.accountName}:</p>
                      <p>{status.error}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        {isTextOnly ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <Label className="text-base font-medium mb-3 block">
                Tekst posta
              </Label>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {content}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="text" className="text-base font-medium">
                Tekst posta
              </Label>
              <Textarea
                {...form.register("text")}
                placeholder="Wpisz tekst posta..."
                className={cn(
                  "min-h-[120px] text-base resize-none",
                  form.formState.errors.text &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {form.formState.errors.text && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{form.formState.errors.text.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-100">
          <Label className="text-base font-medium">Data publikacji</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal text-base",
                    !form.watch("scheduledDate") && "text-muted-foreground",
                    form.formState.errors.scheduledDate &&
                      "border-red-500 focus-visible:ring-red-500"
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

            <div className="relative w-full sm:w-32">
              <Input
                type="time"
                className={cn(
                  "text-base",
                  form.formState.errors.scheduledDate &&
                    "border-red-500 focus-visible:ring-red-500"
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
                  newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  form.setValue("scheduledDate", newDate);
                }}
                disabled={!form.watch("scheduledDate")}
              />
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          {form.formState.errors.scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{form.formState.errors.scheduledDate.message}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(2)}
            className="w-full sm:w-auto"
          >
            Wstecz
          </Button>
          <Button
            type="submit"
            disabled={isPublishing}
            className="w-full sm:w-auto"
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
      </form>
    </div>
  );
}
