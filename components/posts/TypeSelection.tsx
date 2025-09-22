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
  text: <MessageSquareText className="h-5 w-5" />,
  images: <Images className="h-5 w-5" />,
  video: <Clapperboard className="h-5 w-5" />,
};

const cards: Array<{
  type: PostType;
  title: string;
  description: string;
  platforms: string[];
  hint?: string;
  accent: string; // gradient accent utility
}> = [
  {
    type: "text",
    title: "Post tekstowy",
    description: "Krótka wiadomość, ogłoszenie lub wątek bez mediów.",
    platforms: ["Twitter (X)", "Facebook"],
    hint: "Idealny do szybkich aktualizacji i ogłoszeń.",
    accent: "from-emerald-500/15 via-emerald-500/10 to-transparent",
  },
  {
    type: "images",
    title: "Post ze zdjęciami",
    description: "Udostępnij 1–20 zdjęć z podpisem.",
    platforms: ["Twitter (X)", "Facebook", "Instagram", "TikTok"],
    hint: "Najlepsze do wizualnych treści i karuzel.",
    accent: "from-violet-500/15 via-violet-500/10 to-transparent",
  },
  {
    type: "video",
    title: "Post z filmem",
    description: "Opublikuj krótki materiał wideo z opisem.",
    platforms: ["Twitter (X)", "Facebook", "Instagram", "TikTok"],
    hint: "Zwiększa zaangażowanie dzięki treściom wideo.",
    accent: "from-sky-500/15 via-sky-500/10 to-transparent",
  },
];

export default function TypeSelection() {
  const { setCurrentStep, setPostType } = usePostCreation();

  return (
    <section className="w-full">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Wybierz typ posta
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Wybierz, co chcesz opublikować. Dostępne platformy różnią się w
          zależności od typu.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              ].join(" ")}
            >
              <Card
                className={[
                  "relative overflow-hidden border transition-colors",
                  "bg-white/70 dark:bg-zinc-900/60 backdrop-blur",
                  "hover:border-zinc-300 dark:hover:border-zinc-700",
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

                <CardHeader className="relative">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
                          "ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-700/60",
                          "shadow-sm",
                        ].join(" ")}
                      >
                        {TYPE_ICON[card.type]}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="mt-0.5">
                          {card.description}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
                        Wybierz
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {card.hint && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {card.hint}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Dostępne platformy
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {card.platforms.map((p) => (
                      <span
                        key={p}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                          "shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
                          PLATFORM_BADGE_STYLES[p] ??
                            "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                        ].join(" ")}
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
                        {p}
                      </span>
                    ))}
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
