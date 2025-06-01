"use client";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Bubble {
  id: number;
  left: number;
  size: number;
  duration: number;
  gradient: string;
  opacity: number;
  blur: number;
  shadow: string;
}

function BubbleBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  function randomGradient(): string {
    const colors: [string, string][] = [
      ["#3b82f6", "#a5b4fc"], // niebieski
      ["#6366f1", "#f472b6"], // fiolet-róż
      ["#06b6d4", "#818cf8"], // turkus-fiolet
      ["#f472b6", "#facc15"], // róż-żółty
      ["#34d399", "#60a5fa"], // zielony-niebieski
      ["#f59e42", "#f472b6"], // pomarańcz-róż
      ["#facc15", "#f472b6"], // żółty-róż
    ];
    const idx = Math.floor(Math.random() * colors.length);
    return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
  }

  useEffect(() => {
    let id = 0;
    const interval = setInterval(() => {
      setBubbles((prev: Bubble[]) => [
        ...prev,
        {
          id: id++,
          left: Math.min(95, Math.max(5, Math.random() * 100)),
          size: 18 + Math.random() * 32, // mniejsze bąbelki na mobile
          duration: 3 + Math.random() * 3,
          gradient: randomGradient(),
          opacity: 0.4 + Math.random() * 0.4,
          blur: Math.random() * 2.5,
          shadow:
            Math.random() > 0.5
              ? "0 4px 24px 0 rgba(59,130,246,0.15)"
              : "0 2px 12px 0 rgba(139,92,246,0.12)",
        },
      ]);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bubbles.length === 0) return;
    const timeout = setTimeout(() => {
      setBubbles((prev: Bubble[]) => prev.slice(1));
    }, bubbles[0].duration * 1000);
    return () => clearTimeout(timeout);
  }, [bubbles]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {bubbles.map((bubble) => (
        <span
          key={bubble.id}
          style={{
            left: `${bubble.left}%`,
            width: `clamp(16px, ${bubble.size}px, 56px)`,
            height: `clamp(16px, ${bubble.size}px, 56px)`,
            background: bubble.gradient,
            opacity: bubble.opacity,
            filter: `blur(${bubble.blur}px)`,
            boxShadow: bubble.shadow,
            borderRadius: "50%",
            position: "absolute",
            bottom: 0,
            animation: `bubble-float ${bubble.duration}s linear forwards`,
            userSelect: "none",
            display: "block",
            minWidth: "16px",
            minHeight: "16px",
            maxWidth: "56px",
            maxHeight: "56px",
          }}
        />
      ))}
      <style>{`
        @keyframes bubble-float {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          80% { opacity: 1; }
          100% { transform: translateY(-90vh) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function NotFound() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      setOffset({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const playSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext!)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 660;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.12);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
    o.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white px-2 sm:px-4 relative overflow-hidden overflow-x-hidden"
      style={{ perspective: "800px" }}
    >
      <BubbleBackground />
      <div className="flex items-center justify-center mb-6 md:mb-8 select-none relative z-10 w-full max-w-full">
        <span
          className="text-[clamp(3.5rem,12vw,7rem)] md:text-[clamp(6rem,10vw,10rem)] font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-blue-500 via-blue-600 to-slate-900 drop-shadow-lg [text-shadow:2px_2px_0px_rgba(30,41,59,0.10)]"
          style={{
            WebkitTextStroke: "2px #2563eb",
            fontFamily: "Inter, sans-serif",
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotateY(${offset.x / 2}deg) rotateX(${-offset.y / 2}deg)`,
            transition: "transform 0.2s cubic-bezier(.4,2,.6,1)",
            minWidth: "min-content",
          }}
        >
          4
        </span>
        <svg
          className="w-[clamp(3.5rem,12vw,7rem)] h-[clamp(3.5rem,12vw,7rem)] md:w-[clamp(6rem,10vw,10rem)] md:h-[clamp(6rem,10vw,10rem)] mx-1 md:mx-2 drop-shadow-xl flex-shrink-0"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: `translate3d(${offset.x / 2}px, ${offset.y / 2}px, 0) scale(1.05)`,
            transition: "transform 0.2s cubic-bezier(.4,2,.6,1)",
            minWidth: "min-content",
          }}
        >
          <defs>
            <linearGradient
              id="zenGradient"
              x1="0"
              y1="0"
              x2="200"
              y2="200"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#3b82f6" />
              <stop offset="0.5" stopColor="#2563eb" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <path
            d="M100,30 a70,70 0 1,0 0.1,0"
            stroke="url(#zenGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: "blur(0.2px)" }}
          />
        </svg>
        <span
          className="text-[clamp(3.5rem,12vw,7rem)] md:text-[clamp(6rem,10vw,10rem)] font-black text-transparent bg-clip-text bg-gradient-to-tl from-slate-900 via-blue-600 to-blue-500 drop-shadow-lg [text-shadow:2px_2px_0px_rgba(30,41,59,0.10)]"
          style={{
            WebkitTextStroke: "2px #2563eb",
            fontFamily: "Inter, sans-serif",
            transform: `translate3d(${-offset.x}px, ${-offset.y}px, 0) rotateY(${-offset.x / 2}deg) rotateX(${offset.y / 2}deg)`,
            transition: "transform 0.2s cubic-bezier(.4,2,.6,1)",
            minWidth: "min-content",
          }}
        >
          4
        </span>
      </div>
      <h1 className="text-lg xs:text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 text-center mb-2 tracking-tight relative z-10 px-2">
        Tu NIC nie ma…
      </h1>
      <p className="text-gray-600 text-center mb-6 md:mb-8 max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg mx-auto relative z-10 px-2 text-sm xs:text-base md:text-lg">
        Może strona, której szukasz, nie istnieje lub nigdy nie istniała.
        <br />
        Sprawdź adres lub wróć na stronę główną.
      </p>
      <Link href="/" className="inline-block" legacyBehavior>
        <a
          className="flex items-center gap-2 px-6 py-2 md:px-8 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-base md:text-lg shadow transition-colors duration-200 relative z-10"
          onClick={playSound}
        >
          Wróć do strony głównej
          <svg
            className="w-4 h-4 md:w-5 md:h-5 ml-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </Link>
      <div className="absolute bottom-1 right-2 text-[0.65rem] xs:text-xs text-gray-400 md:bottom-4 md:right-8 select-none pointer-events-none z-10">
        <DynamicSignature />
      </div>
    </div>
  );
}

function DynamicSignature() {
  const teksty = [
    "404: Zgubiłeś się w chmurach... ☁️",
    "Nie ma tu nic, ale są bąbelki! 🫧",
    "Może kawa? Tu i tak nic nie znajdziesz ☕",
    "404: To nie jest ta strona, której szukasz...",
    "Ups! Tu tylko powietrze i marzenia 💭",
    "404: Zniknęło szybciej niż bąbelek!",
    "404: Tu nawet Google nie dotarł...",
    "404: Strona wyparowała! 💨",
    "404: Złap bąbelek, zanim zniknie!",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % teksty.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return <span>{teksty[idx]}</span>;
}
