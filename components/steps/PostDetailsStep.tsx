import { Card } from "@/components/ui/card";
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
import {
  CalendarIcon,
  Clock,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { pl } from "date-fns/locale";
import { MediaCarousel } from "@/components/MediaCarousel";
import { socialAccounts } from "@/data/accounts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

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
  text: z.object({
    default: z.string().min(1, "Tekst posta nie może być pusty"),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
  }),
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

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "facebook":
      return <Facebook className="h-4 w-4 text-blue-600" />;
    case "instagram":
      return <Instagram className="h-4 w-4 text-pink-600" />;
    case "twitter":
      return <Twitter className="h-4 w-4 text-blue-400" />;
    default:
      return null;
  }
};

export function PostDetailsStep({ onPublish }: { onPublish: () => void }) {
  const {
    selectedFiles,
    previewUrls,
    selectedAccounts,
    postText,
    setPostText,
    scheduledDate,
    setScheduledDate,
    setCurrentStep,
  } = usePostCreation();

  const [isCustomText, setIsCustomText] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      text: {
        default: postText.default,
        facebook: postText.facebook || "",
        instagram: postText.instagram || "",
        twitter: postText.twitter || "",
      },
      scheduledDate: scheduledDate,
    },
  });

  const onSubmit = (data: PostFormValues) => {
    if (data.scheduledDate) {
      const minTime = getMinScheduleTime();
      if (data.scheduledDate < minTime) {
        form.setValue("scheduledDate", minTime);
        return;
      }
    }
    setPostText(data.text);
    setScheduledDate(data.scheduledDate);
    onPublish();
  };

  return (
    <Card className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Szczegóły posta</h2>

      <div className="mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 mb-2">Wybrane pliki:</p>
        <MediaCarousel files={selectedFiles} urls={previewUrls} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label htmlFor="text">Tekst posta</Label>
            {selectedAccounts.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCustomText(!isCustomText)}
              >
                {isCustomText
                  ? "Użyj wspólnego tekstu"
                  : "Dostosuj tekst per platforma"}
              </Button>
            )}
          </div>

          {!isCustomText ? (
            <div>
              <Textarea
                {...form.register("text.default")}
                placeholder="Wpisz tekst posta..."
                className={cn(
                  "mt-1",
                  form.formState.errors.text?.default &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {form.formState.errors.text?.default && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.text.default.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedAccounts.map((accountId) => {
                const account = socialAccounts.find((a) => a.id === accountId);
                if (!account) return null;

                return (
                  <div key={account.id}>
                    <div className="flex items-center space-x-2 mb-2">
                      {getPlatformIcon(account.platform)}
                      <Label>{account.name}</Label>
                    </div>
                    <Textarea
                      {...form.register(
                        `text.${
                          account.platform as
                            | "facebook"
                            | "instagram"
                            | "twitter"
                        }`
                      )}
                      placeholder={`Wpisz tekst dla ${account.name}...`}
                      defaultValue={form.watch("text.default")}
                      className={cn(
                        "mt-1",
                        form.formState.errors.text?.[
                          account.platform as
                            | "facebook"
                            | "instagram"
                            | "twitter"
                        ] && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <Label>Data publikacji (opcjonalnie)</Label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
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
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.scheduledDate.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(2)}
          >
            Wstecz
          </Button>
          <Button type="submit">
            {form.watch("scheduledDate") ? "Zaplanuj" : "Opublikuj"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
