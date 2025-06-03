import React, { useState } from "react";
import { usePostCreation } from "@/context/PostCreationContext";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Info, Video } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FaFacebook, FaInstagram, FaTwitter, FaTiktok } from "react-icons/fa";
import { IconType } from "react-icons";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SUPPORTED_PLATFORMS,
  PLATFORM_LIMITS,
  PLATFORM_DISPLAY,
} from "@/constants";

export type PostType = "images" | "video" | "text";

interface Platform {
  name: string;
  icon: IconType;
  color: string;
  maxImages: number;
  maxTextLength?: number;
}

interface PostTypeConfig {
  id: PostType;
  title: string;
  description: string;
  icon: IconType;
  platforms: Platform[];
}

export const POST_TYPES: PostTypeConfig[] = [
  {
    id: "images",
    title: "Post ze zdjęciami",
    description: "Dodaj zdjęcia z tekstem",
    icon: ImageIcon,
    platforms: [
      {
        name: "Facebook",
        icon: FaFacebook,
        color: "text-[#1877F2]",
        maxImages: PLATFORM_LIMITS.facebook.maxImageSize,
        maxTextLength: PLATFORM_LIMITS.facebook.maxTextLength,
      },
      {
        name: "Instagram",
        icon: FaInstagram,
        color: "text-[#E4405F]",
        maxImages: PLATFORM_LIMITS.instagram.maxImageSize,
        maxTextLength: PLATFORM_LIMITS.instagram.maxTextLength,
      },
      {
        name: "Twitter",
        icon: FaTwitter,
        color: "text-[#1DA1F2]",
        maxImages: PLATFORM_LIMITS.twitter.maxImageSize,
        maxTextLength: PLATFORM_LIMITS.twitter.maxTextLength,
      },
      {
        name: "TikTok",
        icon: FaTiktok,
        color: "text-black",
        maxImages: PLATFORM_LIMITS.tiktok.maxImageSize,
        maxTextLength: PLATFORM_LIMITS.tiktok.maxTextLength,
      },
    ],
  },
  {
    id: "video",
    title: "Post z filmem",
    description: "Dodaj jeden film z tekstem",
    icon: Video,
    platforms: [
      {
        name: "Facebook",
        icon: FaFacebook,
        color: "text-[#1877F2]",
        maxImages: 0,
        maxTextLength: PLATFORM_LIMITS.facebook.maxTextLength,
      },
      {
        name: "Instagram",
        icon: FaInstagram,
        color: "text-[#E4405F]",
        maxImages: 0,
        maxTextLength: PLATFORM_LIMITS.instagram.maxTextLength,
      },
      {
        name: "TikTok",
        icon: FaTiktok,
        color: "text-black",
        maxImages: 0,
        maxTextLength: PLATFORM_LIMITS.tiktok.maxTextLength,
      },
      {
        name: "Twitter",
        icon: FaTwitter,
        color: "text-[#1DA1F2]",
        maxImages: 0,
        maxTextLength: PLATFORM_LIMITS.twitter.maxTextLength,
      },
    ],
  },
  {
    id: "text",
    title: "Post tekstowy",
    description: "Utwórz post zawierający tylko tekst",
    icon: FileText,
    platforms: [
      {
        name: "Facebook",
        icon: FaFacebook,
        color: "text-[#1877F2]",
        maxImages: 0,
        maxTextLength: PLATFORM_LIMITS.facebook.maxTextLength,
      },
      {
        name: "Twitter",
        icon: FaTwitter,
        color: "text-[#1DA1F2]",
        maxImages: 0,
        maxTextLength: PLATFORM_LIMITS.twitter.maxTextLength,
      },
    ],
  },
];

export function PostTypeSelectionStep() {
  const { setCurrentStep, setIsTextOnly, setPostType } = usePostCreation();
  const [showHelp, setShowHelp] = useState(false);
  const { isSubscribed, isLoading } = useSubscription();

  const handleTypeSelect = (type: PostType) => {
    if (!isSubscribed) {
      return;
    }
    setIsTextOnly(type === "text");
    setPostType(type);
    setCurrentStep(2);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 border rounded-xl"
            >
              <Skeleton className="w-16 h-16 rounded-full mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="flex flex-wrap gap-2 justify-center">
                {[1, 2, 3].map((platformIndex) => (
                  <Skeleton
                    key={platformIndex}
                    className="h-8 w-24 rounded-full"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Tytuł i opis sekcji */}
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-900">Tworzenie posta</h2>
        <p className="text-gray-600 text-base">
          Wybierz sposób, w jaki chcesz utworzyć swój post
        </p>
      </div>
      {/* WYBÓR TYPU POSTA */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 xl:gap-8 mb-8",
          !isSubscribed && "opacity-50 pointer-events-none"
        )}
      >
        {POST_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeSelect(type.id)}
            className={cn(
              "flex flex-col items-center p-6 border rounded-2xl transition-all duration-300 min-h-[220px] bg-white",
              "border-gray-100 shadow-md hover:shadow-xl hover:border-blue-300 hover:bg-blue-50/40 hover:scale-[1.03]"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 shadow-sm">
              <type.icon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {type.title}
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              {type.description}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {type.platforms.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-sm border border-gray-100"
                >
                  <platform.icon className={cn("w-4 h-4", platform.color)} />
                  <span className="text-gray-700">{platform.name}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
      {/* PORADY/INSPIRACJE - mini blog, mniejsze i na dole */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-3 flex gap-3 border border-blue-100">
          <div className="flex-shrink-0 flex items-start pt-0.5">
            <ImageIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-0.5">
              Jak zwiększyć zaangażowanie odbiorców?
            </h4>
            <p className="text-gray-700 text-xs">
              Dodawaj atrakcyjne zdjęcia i grafiki do swoich postów. Obraz
              przyciąga uwagę i sprawia, że użytkownicy chętniej reagują na
              Twoje treści.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-3 flex gap-3 border border-purple-100">
          <div className="flex-shrink-0 flex items-start pt-0.5">
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-0.5">
              Jak pisać skuteczne posty?
            </h4>
            <p className="text-gray-700 text-xs">
              Stosuj krótkie, chwytliwe teksty. Zwięzłość i konkret to klucz do
              skutecznej komunikacji – odbiorcy szybciej zrozumieją Twój
              przekaz.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-3 flex gap-3 border border-pink-100">
          <div className="flex-shrink-0 flex items-start pt-0.5">
            <Video className="h-6 w-6 text-pink-500" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-0.5">
              Dlaczego warto publikować regularnie?
            </h4>
            <p className="text-gray-700 text-xs">
              Systematyczność buduje relację z odbiorcami i zwiększa zasięgi.
              Regularne posty sprawiają, że Twoja marka jest stale obecna w
              świadomości użytkowników.
            </p>
          </div>
        </div>
      </div>
      {/* Dialog pomocy bez zmian */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900">
              Pomoc i wskazówki
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              Wybierz odpowiedni typ posta i poznaj jego możliwości
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-50 p-3">
                  <ImageIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Post ze zdjęciami
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Dodaj zdjęcia (JPG, PNG) wraz z tekstem do swojego posta
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-3 text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Info className="h-4 w-4 text-blue-500" />
                      Limity dla platform
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(SUPPORTED_PLATFORMS).map((platform) => {
                        const { icon: Icon } = PLATFORM_DISPLAY[platform];
                        return (
                          <div
                            key={platform}
                            className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                          >
                            <div className="p-2 rounded-lg bg-[#1877F2]/10">
                              <Icon className="h-5 w-5 text-[#1877F2]" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              do {PLATFORM_LIMITS[platform].maxImageSize} zdjęć
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <Video className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Post z filmem
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Dodaj jeden film (MP4) wraz z tekstem do swojego posta
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-purple-50 p-3">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Post tekstowy
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Utwórz post zawierający tylko tekst
                    </p>
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
