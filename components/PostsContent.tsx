import { useState } from "react";
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
import { Search, Calendar, Clock, Loader2 } from "lucide-react";
import Image from "next/image";
import { MediaType } from "@prisma/client";
import { useApi } from "@/hooks/useApi";
import { getPosts } from "@/lib/api/client";

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

export default function PostsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const { data, isLoading } = useApi<Post[]>(getPosts, {
    showErrorToast: true,
  });

  const posts = data ?? [];

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

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const status = getStatus(post);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const platform =
      post.postConnectedAccounts[0]?.connectedAccount.provider.toLowerCase();
    const matchesPlatform =
      platformFilter === "all" || platform === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Szukaj postów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="published">Opublikowane</SelectItem>
            <SelectItem value="scheduled">Zaplanowane</SelectItem>
            <SelectItem value="draft">Szkice</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Platforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nie znaleziono postów</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const status = getStatus(post);
            const platform =
              post.postConnectedAccounts[0]?.connectedAccount.provider;
            const publishDate = post.publishedAt || post.createdAt;
            const mediaUrl = post.media[0]?.thumbnailUrl || post.media[0]?.url;

            // Sprawdź czy URL jest w formacie base64
            const isBase64 =
              mediaUrl?.startsWith("data:image") ||
              mediaUrl?.startsWith("data:video");

            return (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.media[0] && (
                  <div className="relative h-48">
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
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">
                          Nieprawidłowy format obrazu
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        status
                      )}`}
                    >
                      {getStatusText(status)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(
                        platform
                      )}`}
                    >
                      {platform}
                    </span>
                  </div>
                  <p className="text-gray-700 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(publishDate), "d MMM yyyy", {
                          locale: pl,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
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
    </div>
  );
}
