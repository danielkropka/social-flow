import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Search,
  Calendar,
  Clock,
  Loader2,
  Filter,
  Globe,
  CheckCircle2,
  CalendarClock,
  FileText,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SUPPORTED_PLATFORMS, PLATFORM_DISPLAY } from "@/constants";
import { PublicPost } from "@/types";

interface PostsResponse {
  success: boolean;
  posts: PublicPost[];
  nextCursor?: string;
  error?: string;
}

const POSTS_PER_PAGE = 10;

const PostCard = ({ post }: { post: PublicPost }) => {
  const [imageError, setImageError] = useState(false);

  const getStatus = (post: PublicPost) => {
    if (post.published) return "published";
    if (post.publishedAt) return "scheduled";
    return "draft";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Opublikowany";
      case "scheduled":
        return "Zaplanowany";
      default:
        return "Roboczy";
    }
  };

  const getPlatformColor = (platform: string) => {
    const platformKey = platform.toLowerCase();
    switch (platformKey) {
      case SUPPORTED_PLATFORMS.FACEBOOK:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200";
      case SUPPORTED_PLATFORMS.INSTAGRAM:
        return "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200";
      case SUPPORTED_PLATFORMS.TWITTER:
        return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200";
      case SUPPORTED_PLATFORMS.TIKTOK:
        return "bg-neutral-900 text-white dark:bg-neutral-900 dark:text-white";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const status = getStatus(post);
  const platform =
    post.postConnectedAccounts[0]?.connectedAccount?.provider?.toLowerCase() ||
    "";
  const publishDate = post.publishedAt || post.createdAt;
  const mediaUrl = post.media[0]?.thumbnailUrl || post.media[0]?.url;

  return (
    <div className="group relative text-left focus:outline-none transition-transform duration-150 ease-out hover:-translate-y-0.5">
      <div
        className={cn(
          "relative overflow-hidden border transition-colors",
          "bg-white/70 dark:bg-zinc-900/60 backdrop-blur",
          "hover:border-zinc-300 dark:hover:border-zinc-700",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 -top-16 h-32",
            "bg-gradient-to-b",
            "from-zinc-500/10 via-zinc-500/5 to-transparent",
          )}
        />

        {post.media[0] && (
          <div className="relative h-56 bg-gray-50 dark:bg-zinc-800">
            {mediaUrl && !imageError ? (
              <Image
                src={mediaUrl}
                alt="Post media"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800">
                <div className="text-center p-4">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Brak dostępnego obrazu
                  </p>
                </div>
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium shadow-sm cursor-help",
                        "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                        getStatusColor(status),
                      )}
                    >
                      {getStatusText(status)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status postu: {getStatusText(status)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium shadow-sm cursor-help",
                        "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                        getPlatformColor(platform),
                      )}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Platforma: {platform}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300 line-clamp-3 text-base leading-relaxed">
            {post.content}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-zinc-700">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(publishDate), "d MMM yyyy", {
                          locale: pl,
                        })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Data publikacji</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(publishDate), "HH:mm", {
                          locale: pl,
                        })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Godzina publikacji</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              {post.postConnectedAccounts[0]?.postUrl && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={post.postConnectedAccounts[0].postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                          "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                          platform === SUPPORTED_PLATFORMS.TWITTER &&
                            "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20",
                          platform === SUPPORTED_PLATFORMS.FACEBOOK &&
                            "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
                          platform === SUPPORTED_PLATFORMS.INSTAGRAM &&
                            "bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 text-[#E4405F] hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#F77737]/20",
                          platform === SUPPORTED_PLATFORMS.TIKTOK &&
                            "bg-neutral-900/10 text-neutral-900 hover:bg-neutral-900/20",
                          !(platform in SUPPORTED_PLATFORMS) &&
                            "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                        )}
                      >
                        {(() => {
                          const IconComponent =
                            platform in PLATFORM_DISPLAY
                              ? PLATFORM_DISPLAY[
                                  platform as keyof typeof PLATFORM_DISPLAY
                                ].icon
                              : null;
                          if (IconComponent) {
                            return <IconComponent className="h-4 w-4" />;
                          }
                          return <Globe className="h-4 w-4" />;
                        })()}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Otwórz post na{" "}
                        {
                          post.postConnectedAccounts[0].connectedAccount
                            .provider
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PostsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const { ref, inView } = useInView();

  const fetchPosts = async ({
    pageParam = null,
  }: {
    pageParam: string | null;
  }) => {
    const params = new URLSearchParams({
      limit: POSTS_PER_PAGE.toString(),
      ...(pageParam && { cursor: pageParam }),
      ...(searchQuery && { search: searchQuery }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(platformFilter !== "all" && { platform: platformFilter }),
    });

    const response = await fetch(`/api/posts?${params}`);
    const data: PostsResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Nie udało się pobrać postów");
    }

    return data;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["posts", searchQuery, statusFilter, platformFilter],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (platformFilter !== "all") count++;
    return count;
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPlatformFilter("all");
  };

  const renderPosts = () => {
    if (status === "pending") {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <span className="text-sm text-gray-500">Ładowanie postów...</span>
          </div>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Błąd podczas ładowania postów
            </p>
            <p className="text-xs text-gray-500">
              {error instanceof Error ? error.message : "Nieznany błąd"}
            </p>
          </div>
        </div>
      );
    }

    const posts = data?.pages.flatMap((page) => page.posts) ?? [];

    if (posts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Nie znaleziono postów</p>
            <p className="text-xs text-gray-400">
              Spróbuj zmienić kryteria wyszukiwania lub filtry
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Ładowanie kolejnych postów...</span>
              </div>
            ) : (
              <button
                onClick={() => fetchNextPage()}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Załaduj więcej
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <section className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Posty
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Zarządzaj swoimi postami i ich statusami
        </p>
      </header>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Input and Actions */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Szukaj postów po treści lub platformie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isFiltersVisible
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
              )}
            >
              <Filter className="h-4 w-4" />
              Filtry
              {getActiveFiltersCount() > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>

        {/* Platform Filters */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isFiltersVisible
              ? "max-h-[500px] opacity-100"
              : "max-h-0 opacity-0",
          )}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtruj posty:
              </span>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "all",
                  label: "Wszystkie",
                  icon: Globe,
                  color: "text-gray-600",
                },
                {
                  value: "published",
                  label: "Opublikowane",
                  icon: CheckCircle2,
                  color: "text-green-600",
                },
                {
                  value: "scheduled",
                  label: "Zaplanowane",
                  icon: CalendarClock,
                  color: "text-orange-600",
                },
                {
                  value: "draft",
                  label: "Szkice",
                  icon: FileText,
                  color: "text-gray-600",
                },
              ].map((status) => {
                const Icon = status.icon;
                const isSelected = statusFilter === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", status.color)} />
                    {status.label}
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            {/* Platform Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "all",
                  label: "Wszystkie platformy",
                  icon: Globe,
                  color: "text-gray-600",
                },
                ...Object.values(SUPPORTED_PLATFORMS).map((platformKey) => ({
                  value: platformKey,
                  label: PLATFORM_DISPLAY[platformKey].label,
                  icon: PLATFORM_DISPLAY[platformKey].icon,
                  color: PLATFORM_DISPLAY[platformKey].color,
                })),
              ].map((platform) => {
                const IconComponent = platform.icon;
                const isSelected = platformFilter === platform.value;
                return (
                  <button
                    key={platform.value}
                    onClick={() => setPlatformFilter(platform.value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                      isSelected
                        ? "border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-950/40 dark:text-purple-200"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700",
                    )}
                  >
                    <IconComponent
                      className={cn("h-3.5 w-3.5", platform.color)}
                    />
                    {platform.label}
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {renderPosts()}
    </section>
  );
}
