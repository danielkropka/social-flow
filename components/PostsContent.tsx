import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Search, Calendar, Clock, Loader2, Filter } from "lucide-react";
import Image from "next/image";
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

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

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500">Ładowanie postów...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">
          Wystąpił błąd:{" "}
          {error instanceof Error ? error.message : "Nieznany błąd"}
        </p>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Posty</h1>
        <p className="text-gray-600">
          Zarządzaj swoimi postami i ich statusami
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Szukaj postów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-base bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            {isFiltersVisible ? "Ukryj filtry" : "Pokaż filtry"}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden">
            {isFiltersVisible && (
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="published">Opublikowane</SelectItem>
                    <SelectItem value="scheduled">Zaplanowane</SelectItem>
                    <SelectItem value="draft">Szkice</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={platformFilter}
                  onValueChange={setPlatformFilter}
                >
                  <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Platforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-700 text-lg">Nie znaleziono postów</p>
          <p className="text-gray-500 text-sm mt-2">
            Spróbuj zmienić kryteria wyszukiwania lub filtry
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {posts.map((post) => {
            const status = getStatus(post);
            const platform =
              post.postConnectedAccounts[0]?.connectedAccount?.provider?.toLowerCase() ||
              "";
            const publishDate = post.publishedAt || post.createdAt;
            const mediaUrl = post.media[0]?.thumbnailUrl || post.media[0]?.url;
            const isBase64 =
              mediaUrl?.startsWith("data:image") ||
              mediaUrl?.startsWith("data:video");

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                {post.media[0] && (
                  <div className="relative h-48 bg-gray-50">
                    {isBase64 ? (
                      <Image
                        src={mediaUrl}
                        alt="Post media"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error("Błąd ładowania obrazu:", mediaUrl);
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.src = "/placeholder-image.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500 text-sm">
                          Nieprawidłowy format obrazu
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        getStatusColor(status)
                      )}
                    >
                      {getStatusText(status)}
                    </span>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        getPlatformColor(platform)
                      )}
                    >
                      {platform}
                    </span>
                  </div>
                  <p className="text-gray-700 line-clamp-3 text-base leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(publishDate), "d MMM yyyy", {
                          locale: pl,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(publishDate), "HH:mm", {
                          locale: pl,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Załaduj więcej
            </button>
          )}
        </div>
      )}
    </div>
  );
}
