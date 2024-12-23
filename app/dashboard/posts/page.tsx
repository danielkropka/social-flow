"use client";

import { db } from "@/lib/prisma";
import moment from "moment";
import "moment/locale/pl";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Media, Provider } from "@prisma/client";

moment.locale("pl");

interface ConnectedAccount {
  id: string;
  name: string;
  provider: string;
}

interface PostConnectedAccount {
  connectedAccount: ConnectedAccount;
}

export default function PostsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [platform, setPlatform] = useState<Provider | "ALL">("ALL");
  const [posts, setPosts] = useState<any[]>([]);

  const handleFilter = async () => {
    const params = new URLSearchParams();
    if (dateRange?.from)
      params.append("dateFrom", dateRange.from.toISOString());
    if (dateRange?.to) params.append("dateTo", dateRange.to.toISOString());
    if (platform !== "ALL") params.append("platform", platform);

    const response = await fetch(`/api/posts/get?${params}`);
    const filteredPosts = await response.json();
    setPosts(filteredPosts);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Zrealizowane posty</h1>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Wybierz zakres dat"
          />
          <Select
            value={platform}
            onValueChange={(value: Provider | "ALL") => setPlatform(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz platformę" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="TWITTER">Twitter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleFilter}>Filtruj</Button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{post.content}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Opublikowano {moment(post.publishedAt).fromNow()}
                </div>
                <div className="mt-1 flex gap-2">
                  {post.postConnectedAccounts.map(
                    ({ connectedAccount }: PostConnectedAccount) => (
                      <span
                        key={connectedAccount.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {connectedAccount.name}
                      </span>
                    )
                  )}
                </div>
              </div>
              {post.media.length > 0 && (
                <div className="flex gap-2 ml-4">
                  {post.media.map((media: Media) =>
                    media.type === "VIDEO" ? (
                      <video
                        key={media.id}
                        src={media.url}
                        className="w-20 h-20 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        key={media.id}
                        src={media.url}
                        alt="Post media"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            Nie znaleziono postów spełniających kryteria
          </div>
        )}
      </div>
    </div>
  );
}
