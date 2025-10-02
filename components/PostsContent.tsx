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
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
} from "lucide-react";
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
  // Generate mock engagement stats based on post ID for consistency
  const generateStats = (postId: string) => {
    const seed = postId.charCodeAt(0) + postId.charCodeAt(postId.length - 1);
    return {
      likes: Math.floor((seed % 50) + 10),
      comments: Math.floor((seed % 20) + 2),
      shares: Math.floor((seed % 15) + 1),
      views: Math.floor((seed % 200) + 50),
    };
  };

  const stats = generateStats(post.id);

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

  // Format post content with proper paragraphs
  const formatPostContent = (content: string) => {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map((paragraph, index) => (
        <p key={index} className="mb-3 last:mb-0 text-gray-800 dark:text-gray-200 leading-relaxed">
          {paragraph.trim()}
        </p>
      ));
  };

  return (
    <article className="group relative">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border transition-all duration-300 ease-out",
          "bg-white dark:bg-zinc-900",
          "border-gray-200 dark:border-zinc-800",
          "hover:border-gray-300 dark:hover:border-zinc-700",
          "hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-zinc-900/50",
          "hover:-translate-y-1",
        )}
      >
        {/* Header with badges */}
        <div className="relative p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-wrap gap-2">
              {/* Post Type Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        "shadow-sm border",
                        post.media[0] 
                          ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200 dark:from-purple-950/50 dark:to-purple-900/50 dark:text-purple-300 dark:border-purple-800"
                          : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 dark:border-blue-800"
                      )}
                    >
                      {post.media[0] ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Z mediami
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Tekstowy
                        </>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Typ postu: {post.media[0] ? "Z mediami" : "Tekstowy"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Trending Badge */}
              {status === "published" && stats.likes > 30 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200 dark:from-orange-950/50 dark:to-orange-900/50 dark:text-orange-300 dark:border-orange-800 shadow-sm">
                        <TrendingUp className="h-3 w-3" />
                        Trending
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Popularny post!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Status Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm border",
                        getStatusColor(status),
                        "border-gray-200 dark:border-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        status === "published" ? "bg-green-500" : 
                        status === "scheduled" ? "bg-blue-500" : "bg-gray-500"
                      )}></div>
                      {getStatusText(status)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status postu: {getStatusText(status)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Platform Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm border",
                        getPlatformColor(platform),
                        "border-gray-200 dark:border-zinc-700"
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
                          return <IconComponent className="h-3 w-3" />;
                        }
                        return <Globe className="h-3 w-3" />;
                      })()}
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
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-5">
          {/* Post Content */}
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {formatPostContent(post.content)}
            </div>
            
            {/* Content Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  {post.content.length} znaków
                </span>
                <span className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    post.content.length > 200 ? "bg-green-500" : "bg-blue-500"
                  )}></div>
                  {post.content.length > 200 ? "Długi post" : "Krótki post"}
                </span>
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          {status === "published" && (
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">{stats.likes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{stats.comments}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{stats.shares}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{stats.views}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer with Date and Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
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
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
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
                {/* Copy Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(post.content)
                        }
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 hover:scale-105"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Kopiuj treść</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* External Link Button */}
                {post.postConnectedAccounts[0]?.postUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={post.postConnectedAccounts[0].postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 hover:scale-105",
                            "ring-1 ring-inset ring-gray-200 dark:ring-zinc-700",
                            platform === SUPPORTED_PLATFORMS.TWITTER &&
                              "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20",
                            platform === SUPPORTED_PLATFORMS.FACEBOOK &&
                              "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
                            platform === SUPPORTED_PLATFORMS.INSTAGRAM &&
                              "bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 text-[#E4405F] hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#F77737]/20",
                            platform === SUPPORTED_PLATFORMS.TIKTOK &&
                              "bg-neutral-900/10 text-neutral-900 hover:bg-neutral-900/20",
                            !(platform in SUPPORTED_PLATFORMS) &&
                              "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
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
    </article>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
