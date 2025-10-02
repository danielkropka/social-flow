"use client";

import React, { useMemo, useState } from "react";
import {
  addWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Image,
  Video,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePostCreation } from "@/context/PostCreationContext";

// Types
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "DELETED";
type Provider = "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "TIKTOK" | "GOOGLE";

interface Post {
  id: string;
  content: string;
  status: PostStatus;
  published: boolean;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  media: Array<{
    id: string;
    url: string;
    type: string;
    thumbnailUrl?: string;
  }>;
  postConnectedAccounts: Array<{
    id: string;
    status: string;
    postUrl?: string;
    publishedAt?: string;
    connectedAccount: {
      provider: Provider;
      displayName: string;
    };
  }>;
}

interface WeeklyCalendarProps {
  className?: string;
}

// Status colors and icons
const statusConfig: Record<
  PostStatus,
  {
    colors: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  DRAFT: {
    colors:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-950/30 dark:text-amber-300",
    icon: FileText,
    label: "Szkic",
  },
  SCHEDULED: {
    colors:
      "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-800 dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30 dark:text-blue-300",
    icon: Clock,
    label: "Zaplanowany",
  },
  PUBLISHED: {
    colors:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-800 dark:border-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30 dark:text-emerald-300",
    icon: CheckCircle,
    label: "Opublikowany",
  },
  FAILED: {
    colors:
      "border-red-200 bg-gradient-to-br from-red-50 to-rose-50 text-red-800 dark:border-red-700 dark:from-red-950/30 dark:to-rose-950/30 dark:text-red-300",
    icon: AlertCircle,
    label: "Błąd",
  },
  DELETED: {
    colors:
      "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 text-gray-600 dark:border-zinc-700 dark:from-zinc-950/30 dark:to-slate-950/30 dark:text-zinc-400",
    icon: Eye,
    label: "Usunięty",
  },
};

// Fetch posts from API
const fetchPosts = async (
  startDate: string,
  endDate: string,
): Promise<Post[]> => {
  const response = await fetch(
    `/api/posts?startDate=${startDate}&endDate=${endDate}&limit=100`,
  );
  if (!response.ok) {
    throw new Error("Błąd podczas pobierania postów");
  }
  const data = await response.json();
  return data.posts || [];
};

export default function WeeklyCalendar({ className }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const { resetState, setIsSheetOpen } = usePostCreation();

  // Calculate week range
  const weekStart = useMemo(
    () => startOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentWeek, { weekStartsOn: 1 }),
    [currentWeek],
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd],
  );

  // Fetch posts for current week
  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts", weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: () => fetchPosts(weekStart.toISOString(), weekEnd.toISOString()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Group posts by day
  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((post) => {
      const postDate = post.scheduledFor || post.publishedAt || post.createdAt;
      const dayKey = format(new Date(postDate), "yyyy-MM-dd");
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)!.push(post);
    });
    return map;
  }, [posts]);

  // Navigation
  const goToPreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeek(new Date());

  // Post actions
  const handleCreatePost = () => {
    resetState();
    setIsSheetOpen(true);
  };

  const handleDeletePost = () => {
    toast.info("Funkcja usuwania postów będzie dostępna wkrótce");
  };

  // Media type icon helper
  const getMediaIcon = (mediaType: string) => {
    if (mediaType.includes("image")) return Image;
    if (mediaType.includes("video")) return Video;
    return FileText;
  };

  // Day cell component
  const DayCell = ({ day }: { day: Date }) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const dayPosts = postsByDay.get(dayKey) || [];
    const isToday = isSameDay(day, new Date());
    const isCurrentMonth = day.getMonth() === currentWeek.getMonth();
    const isPastDay = day < new Date() && !isToday;

    return (
      <Card
        className={`group relative h-32 sm:h-40 border border-gray-200/60 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300 hover:scale-[1.02] ${!isCurrentMonth ? "opacity-50" : ""} ${isToday ? "ring-2 ring-blue-500/20 shadow-blue-500/10" : ""}`}
      >
        <CardContent className="p-2 sm:p-3 h-full flex flex-col gap-1 sm:gap-2">
          {/* Day header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge
                variant={isToday ? "default" : "outline"}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold transition-all duration-200 ${
                  isToday
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg shadow-blue-500/25"
                    : "border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {format(day, "d", { locale: pl })}
              </Badge>
              {dayPosts.length > 0 && (
                <Badge
                  variant="secondary"
                  className="px-1 sm:px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {dayPosts.length}
                </Badge>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 transition-all duration-200 ${
                      isPastDay
                        ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-zinc-600"
                        : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/40 dark:hover:to-indigo-950/40 text-gray-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:scale-110"
                    }`}
                    onClick={() => !isPastDay && handleCreatePost()}
                    disabled={isPastDay}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isPastDay
                    ? "Nie można dodawać postów w przeszłości"
                    : "Nowy post"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Posts list */}
          <div className="flex-1 flex flex-col gap-1 sm:gap-1.5 overflow-hidden">
            {dayPosts.slice(0, 2).map((post) => {
              const statusInfo = statusConfig[post.status];
              const StatusIcon = statusInfo.icon;
              const hasMedia = post.media && post.media.length > 0;
              const MediaIcon = hasMedia
                ? getMediaIcon(post.media[0].type)
                : null;

              return (
                <div
                  key={post.id}
                  className={`group/post relative flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 text-left hover:shadow-md transition-all duration-200 cursor-pointer rounded-lg border backdrop-blur-sm ${statusInfo.colors} hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    <StatusIcon className="h-3 w-3 flex-shrink-0" />
                    {MediaIcon && (
                      <MediaIcon className="h-3 w-3 flex-shrink-0 opacity-70" />
                    )}
                    <span className="truncate text-xs font-medium leading-tight">
                      {post.content.slice(0, 20)}
                      {post.content.length > 20 && "..."}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        className="h-4 w-4 sm:h-5 sm:w-5 p-0 hover:bg-white/50 dark:hover:bg-black/20 cursor-pointer flex items-center justify-center rounded opacity-0 group-hover/post:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edytuj post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeletePost()}
                        className="gap-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        Usuń post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {dayPosts.length > 2 && (
              <div
                className="px-1 sm:px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded transition-colors duration-200"
                onClick={() => alert(`Pokaż więcej (${dayPosts.length - 2})`)}
              >
                +{dayPosts.length - 2} więcej
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className="p-8 text-center border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:border-red-700 dark:from-red-950/30 dark:to-rose-950/30">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
              Błąd ładowania
            </h3>
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Spróbuj ponownie
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600  rounded-lg shadow-lg shadow-blue-500/25">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Kalendarz tygodniowy
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Zarządzaj swoimi postami w czasie rzeczywistym
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto">
          <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/60 dark:border-zinc-700/60 shadow-lg shadow-gray-900/5">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousWeek}
              aria-label="Poprzedni tydzień"
              className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[180px] sm:min-w-[220px] text-center px-2 sm:px-3 py-1">
              <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {format(weekStart, "d MMM", { locale: pl })} –{" "}
                {format(weekEnd, "d MMM yyyy", { locale: pl })}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tydzień{" "}
                {Math.ceil(
                  (weekStart.getTime() -
                    new Date(weekStart.getFullYear(), 0, 1).getTime()) /
                    (7 * 24 * 60 * 60 * 1000),
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextWeek}
              aria-label="Następny tydzień"
              className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={goToCurrentWeek}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 text-sm sm:text-base"
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ten tydzień</span>
            <span className="sm:hidden">Dziś</span>
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="mb-4 grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={day.toISOString()}
              className="px-1 sm:px-3 py-2 text-center"
            >
              <div
                className={`text-xs font-medium uppercase tracking-wide ${
                  isWeekend
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-500 dark:text-zinc-400"
                }`}
              >
                {format(day, "EEE", { locale: pl })}
              </div>
              <div
                className={`text-sm font-bold mt-1 ${
                  isToday
                    ? "text-blue-600 dark:text-blue-400"
                    : isWeekend
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                }`}
              >
                {format(day, "d", { locale: pl })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {weekDays.map((day) => (
          <DayCell key={day.toISOString()} day={day} />
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
              <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border-3 border-blue-600/20 dark:border-blue-400/20"></div>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-zinc-400">
              Ładowanie postów...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
