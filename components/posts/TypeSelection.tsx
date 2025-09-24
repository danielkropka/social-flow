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
  stats: {
    engagement: string;
    reach: string;
    time: string;
  };
  tips: string[];
  accent: string; // gradient accent utility
}> = [
  {
    type: "text",
    title: "Post tekstowy",
    description: "Krótka wiadomość, ogłoszenie lub wątek bez mediów.",
    platforms: ["Twitter (X)", "Facebook"],
    hint: "Idealny do szybkich aktualizacji i ogłoszeń.",
    stats: {
      engagement: "Średnie zaangażowanie",
      reach: "Szybki zasięg",
      time: "1-2 min publikacji",
    },
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
    stats: {
      engagement: "Wysokie zaangażowanie",
      reach: "Szerszy zasięg",
      time: "3-5 min publikacji",
    },
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
    stats: {
      engagement: "Najwyższe zaangażowanie",
      reach: "Maksymalny zasięg",
      time: "5-10 min publikacji",
    },
    tips: [
      "Pierwsze 3 sekundy = najważniejsze",
      "Dodaj napisy automatycznie",
      "Maksymalnie 15 sekund na TikTok",
      "Zakończ pytaniem lub CTA",
    ],
    accent: "from-sky-500/15 via-sky-500/10 to-transparent",
  },
];

export default function TypeSelection() {
  const { setCurrentStep, setPostType } = usePostCreation();

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Wybierz typ posta
        </h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
          Wybierz, co chcesz opublikować. Dostępne platformy różnią się w
          zależności od typu.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:gap-6">
        {cards.map((card) => {
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => {
                setCurrentStep(2);
                setPostType(card.type);
              }}
              className={[
                "group relative text-left focus:outline-none",
                "transition-transform duration-150 ease-out hover:-translate-y-0.5",
                "w-full",
              ].join(" ")}
            >
              <Card
                className={[
                  "relative overflow-hidden border transition-colors",
                  "bg-white/70 dark:bg-zinc-900/60 backdrop-blur",
                  "hover:border-zinc-300 dark:hover:border-zinc-700",
                  "h-full min-h-[320px] sm:min-h-[380px]",
                ].join(" ")}
              >
                <div
                  aria-hidden
                  className={[
                    "pointer-events-none absolute inset-x-0 -top-16 h-32",
                    "bg-gradient-to-b",
                    card.accent,
                  ].join(" ")}
                />

                <CardHeader className="relative p-4 sm:p-6">
                  <div className="mb-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={[
                          "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg flex-shrink-0",
                          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                          "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                          "shadow-sm",
                        ].join(" ")}
                      >
                        {TYPE_ICON[card.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base leading-tight">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs sm:text-sm leading-relaxed">
                          {card.description}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 whitespace-nowrap">
                        Wybierz
                        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </span>
                    </div>
                  </div>

                  {card.hint && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                      {card.hint}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  {/* Stats Section */}
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Statystyki
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Zaangażowanie:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {card.stats.engagement}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Zasięg:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {card.stats.reach}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Czas:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {card.stats.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Wskazówki
                    </p>
                    <ul className="space-y-1.5">
                      {card.tips.map((tip, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                        >
                          <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">
                            💡
                          </span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Platforms Section */}
                  <div>
                    <p className="mb-2 sm:mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Dostępne platformy
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {card.platforms.map((p) => (
                        <span
                          key={p}
                          className={[
                            "inline-flex items-center gap-1 sm:gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium",
                            "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                            "flex-shrink-0",
                            PLATFORM_BADGE_STYLES[p] ??
                              "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                          ].join(" ")}
                        >
                          {p.includes("Twitter") && (
                            <SiX className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                          )}
                          {p === "Facebook" && (
                            <SiFacebook className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                          )}
                          {p === "Instagram" && (
                            <SiInstagram className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                          )}
                          {p === "TikTok" && (
                            <SiTiktok className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                          )}
                          <span className="truncate">{p}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
