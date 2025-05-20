import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Facebook,
  Instagram,
  Twitter,
  BarChart3,
  Share2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Post {
  id: string;
  content: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  media: {
    id: string;
    url: string;
    type: MediaType;
    thumbnailUrl: string | null;
  }[];
  postConnectedAccounts: {
    postUrl?: string;
    connectedAccount: {
      provider: string;
      name: string;
    };
  }[];
}

interface PostsResponse {
  success: boolean;
  posts: Post[];
  nextCursor?: string;
  error?: string;
}

const POSTS_PER_PAGE = 10;

const PostCard = ({ post }: { post: Post }) => {
  const [imageError, setImageError] = useState(false);

  const getStatus = (post: Post) => {
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
    switch (platform.toLowerCase()) {
      case "facebook":
        return "bg-blue-100 text-blue-800";
      case "instagram":
        return "bg-pink-100 text-pink-800";
      case "twitter":
        return "bg-sky-100 text-sky-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const status = getStatus(post);
  const platform =
    post.postConnectedAccounts[0]?.connectedAccount?.provider?.toLowerCase() ||
    "";
  const publishDate = post.publishedAt || post.createdAt;
  const mediaUrl = post.media[0]?.thumbnailUrl || post.media[0]?.url;

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      {post.media[0] && (
        <div className="relative h-56 bg-gray-50">
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
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-4">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Brak dostępnego obrazu</p>
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
                      getStatusColor(status)
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
                      getPlatformColor(platform)
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
        <p className="text-gray-700 line-clamp-3 text-base leading-relaxed">
          {post.content}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
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
                        platform === "twitter" &&
                          "bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20",
                        platform === "facebook" &&
                          "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
                        platform === "instagram" &&
                          "bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 text-[#E4405F] hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#F77737]/20",
                        !["twitter", "facebook", "instagram"].includes(
                          platform
                        ) && "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {platform === "twitter" && (
                        <Twitter className="h-4 w-4" />
                      )}
                      {platform === "facebook" && (
                        <Facebook className="h-4 w-4" />
                      )}
                      {platform === "instagram" && (
                        <Instagram className="h-4 w-4" />
                      )}
                      {!["twitter", "facebook", "instagram"].includes(
                        platform
                      ) && <Globe className="h-4 w-4" />}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Otwórz post na{" "}
                      {post.postConnectedAccounts[0].connectedAccount.provider}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
            >
              <Skeleton className="h-56 w-full" />
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 text-lg font-medium mb-2">
              Wystąpił błąd podczas ładowania postów
            </p>
            <p className="text-gray-500">
              {error instanceof Error ? error.message : "Nieznany błąd"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      );
    }

    const posts = data?.pages.flatMap((page) => page.posts) ?? [];

    if (posts.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="max-w-md mx-auto">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium mb-2">
              Nie znaleziono postów
            </p>
            <p className="text-gray-500 text-sm">
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
                className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Posty</h1>
        <p className="text-gray-600">
          Zarządzaj swoimi postami i ich statusami
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0S opacity-50" />
          <div className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Szukaj postów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    isFiltersVisible
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
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
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isFiltersVisible ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Status
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "all",
                      label: "Wszystkie",
                      icon: Globe,
                      color: "text-blue-600",
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
                    return (
                      <button
                        key={status.value}
                        onClick={() => setStatusFilter(status.value)}
                        className={cn(
                          "group relative px-4 py-3 rounded-xl border transition-all duration-200",
                          statusFilter === status.value
                            ? "bg-blue-50 border-blue-200"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-5 w-5", status.color)} />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              statusFilter === status.value
                                ? "text-blue-700"
                                : "text-gray-700 group-hover:text-blue-700"
                            )}
                          >
                            {status.label}
                          </span>
                        </div>
                        {statusFilter === status.value && (
                          <div className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Platforma
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "all",
                      label: "Wszystkie",
                      icon: Globe,
                      color: "text-gray-600",
                    },
                    {
                      value: "facebook",
                      label: "Facebook",
                      icon: Facebook,
                      color: "text-[#1877F2]",
                    },
                    {
                      value: "instagram",
                      label: "Instagram",
                      icon: Instagram,
                      color: "text-[#E4405F]",
                    },
                    {
                      value: "twitter",
                      label: "Twitter",
                      icon: Twitter,
                      color: "text-[#1DA1F2]",
                    },
                  ].map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.value}
                        onClick={() => setPlatformFilter(platform.value)}
                        className={cn(
                          "group relative px-4 py-3 rounded-xl border transition-all duration-200",
                          platformFilter === platform.value
                            ? "bg-purple-50 border-purple-200"
                            : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-5 w-5", platform.color)} />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              platformFilter === platform.value
                                ? "text-purple-700"
                                : "text-gray-700 group-hover:text-purple-700"
                            )}
                          >
                            {platform.label}
                          </span>
                        </div>
                        {platformFilter === platform.value && (
                          <div className="absolute inset-0 rounded-xl border-2 border-purple-500 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderPosts()}
    </div>
  );
}
