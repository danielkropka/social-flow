"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  MessageSquareText,
  Images,
  Clapperboard,
  ArrowRight,
} from "lucide-react";
import { SiTiktok, SiFacebook, SiX, SiInstagram } from "react-icons/si";
import {
  PostCreationState,
  usePostCreation,
} from "@/context/PostCreationContext";

// New subtle motion utils without adding deps
const hoverTilt =
  "transition-transform duration-200 ease-out group-hover:-translate-y-0.5 active:group-active:translate-y-0";
const shineOverlay =
  "before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(600px_200px_at_var(--x,50%)_-20%,rgba(255,255,255,0.25),transparent_60%)] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300";
const gradientRing =
  "ring-1 ring-transparent group-hover:ring-zinc-200/70 dark:group-hover:ring-zinc-700/60";
const glassPanel =
  "bg-white/70 dark:bg-zinc-900/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur";

type PostType = Exclude<PostCreationState["postType"], null>;

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  "Twitter (X)":
    "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900",
  Facebook:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900",
  Instagram:
    "bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:border-pink-900",
  TikTok:
    "bg-neutral-900 text-white border-neutral-800 dark:bg-neutral-900 dark:text-white dark:border-neutral-800",
};

const TYPE_ICON: Record<PostType, React.ReactNode> = {
  text: <MessageSquareText className="h-4 w-4 sm:h-5 sm:w-5" />,
  images: <Images className="h-4 w-4 sm:h-5 sm:w-5" />,
  video: <Clapperboard className="h-4 w-4 sm:h-5 sm:w-5" />,
};

const cards: Array<{
  type: PostType;
  title: string;
  description: string;
  platforms: string[];
  hint?: string;
  tips: string[];
  accent: string; // gradient accent utility
}> = [
  {
    type: "text",
    title: "Post tekstowy",
    description: "Krótka wiadomość, ogłoszenie lub wątek bez mediów.",
    platforms: ["Twitter (X)", "Facebook"],
    hint: "Idealny do szybkich aktualizacji i ogłoszeń.",
    tips: [
      "Zadaj pytanie na końcu posta",
      "Używaj maksymalnie 2-3 hashtagów",
      "Dodaj emoji co 2-3 zdania",
      "Publikuj między 9-11 i 19-21",
    ],
    accent: "from-emerald-500/15 via-emerald-500/10 to-transparent",
  },
  {
    type: "images",
    title: "Post ze zdjęciami",
    description: "Udostępnij 1–20 zdjęć z podpisem.",
    platforms: ["Twitter (X)", "Facebook", "Instagram", "TikTok"],
    hint: "Najlepsze do wizualnych treści i karuzel.",
    tips: [
      "Pierwsze zdjęcie = najlepsze zdjęcie",
      "Dodaj tekst na zdjęciu dla większego zasięgu",
      "Używaj formatu 4:5 dla Instagrama",
      "Maksymalnie 5 zdjęć w karuzeli",
    ],
    accent: "from-violet-500/15 via-violet-500/10 to-transparent",
  },
  {
    type: "video",
    title: "Post z filmem",
    description: "Opublikuj krótki materiał wideo z opisem.",
    platforms: ["Twitter (X)", "Facebook", "Instagram", "TikTok"],
    hint: "Zwiększa zaangażowanie dzięki treściom wideo.",
    tips: [
      "Pierwsze 3 sekundy = najważniejsze",
      "Dodaj napisy automatycznie",
      "Maksymalnie 15 sekund na TikTok",
      "Zakończ pytaniem lub CTA",
    ],
    accent: "from-sky-500/15 via-sky-500/10 to-transparent",
  },
];

export default function TypeSelectionSheet() {
  const { setCurrentStep, setPostType } = usePostCreation();

  const handleTypeSelect = (type: PostType) => {
    setPostType(type);
    setCurrentStep(2);
  };

  // Mouse-position shine for cards
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    el.style.setProperty("--x", `${x}%`);
  };

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 gap-5">
        {cards.map((card) => (
          <button
            key={card.type}
            type="button"
            onClick={() => handleTypeSelect(card.type)}
            className={`group relative text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-2xl ${hoverTilt}`}
            aria-label={`Wybierz: ${card.title}`}
          >
            <Card
              onMouseMove={onMouseMove}
              className={`relative overflow-hidden border ${glassPanel} rounded-2xl transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 ${shineOverlay} ${gradientRing}`}
            >
              <div
                aria-hidden
                className={[
                  "pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b",
                  card.accent,
                ].join(" ")}
              />

              {/* Animated top border accent */}
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent dark:via-zinc-700/60" />

              <CardHeader className="relative p-5 sm:p-6">
                <div className="mb-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60 shadow-sm">
                        {TYPE_ICON[card.type]}
                      </div>
                      <span className="pointer-events-none absolute -inset-0.5 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/25 to-transparent dark:via-white/10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg leading-tight">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm leading-relaxed">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
                    Wybierz
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                {card.hint && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {card.hint}
                  </p>
                )}
              </CardHeader>

              <CardContent className="p-5 sm:p-6 pt-0 space-y-5">
                {/* Tips with numbered bullets for scannability */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Wskazówki
                  </p>
                  <ul className="space-y-1.5">
                    {card.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500/20 text-[10px] mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Platforms with pill badges */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Dostępne platformy
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {card.platforms.map((p) => (
                      <span
                        key={p}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                          PLATFORM_BADGE_STYLES[p] ??
                            "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                        ].join(" ")}
                        title={p}
                      >
                        {p.includes("Twitter") && (
                          <SiX className="h-3.5 w-3.5" />
                        )}
                        {p === "Facebook" && (
                          <SiFacebook className="h-3.5 w-3.5" />
                        )}
                        {p === "Instagram" && (
                          <SiInstagram className="h-3.5 w-3.5" />
                        )}
                        {p === "TikTok" && <SiTiktok className="h-3.5 w-3.5" />}
                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {p}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>

              {/* Soft bottom glow */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/5 to-transparent dark:from-white/5" />
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
