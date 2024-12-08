import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

interface VideoThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  onThumbnailSelect: (thumbnailUrl: string) => void;
  currentThumbnail?: string;
}

export function VideoThumbnailModal({
  isOpen,
  onClose,
  videoUrl,
  onThumbnailSelect,
  currentThumbnail,
}: VideoThumbnailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(
    currentThumbnail || null
  );
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const captureFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCurrentFrame(canvas.toDataURL("image/jpeg"));
  };

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoRef.current || !videoUrl) return;

      try {
        const video = videoRef.current;
        video.src = videoUrl;

        // Czekamy na załadowanie metadanych
        await new Promise<void>((resolve) => {
          const handleLoad = () => {
            console.log("Video loaded, duration:", video.duration);
            setDuration(video.duration);
            setIsVideoReady(true);
            resolve();
          };

          if (video.readyState >= 2) {
            handleLoad();
          } else {
            video.addEventListener("loadeddata", handleLoad, { once: true });
          }
        });
      } catch (error) {
        console.error("Error loading video:", error);
      }
    };

    loadVideo();
  }, [videoUrl]);

  const handleTimeChange = (value: number[]) => {
    if (!videoRef.current || !isVideoReady) return;

    const newTime = value[0];
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    captureFrame();
  };

  const handleVideoTimeUpdate = () => {
    captureFrame();
  };

  const handleSave = () => {
    if (currentFrame) {
      onThumbnailSelect(currentFrame);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Wybierz miniaturę filmu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">
                Aktualna klatka
              </p>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleVideoTimeUpdate}
                  preload="auto"
                  muted
                  playsInline
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">
                {currentFrame === currentThumbnail
                  ? "Zapisana miniatura"
                  : "Nowa miniatura"}
              </p>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {(currentFrame || currentThumbnail) && (
                  <Image
                    src={currentFrame || currentThumbnail || ""}
                    alt="Podgląd miniatury"
                    className="w-full h-full object-contain"
                    fill
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handleTimeChange}
              className="w-full"
              disabled={!isVideoReady}
            />
            <div className="text-sm text-gray-500 text-center">
              {isVideoReady
                ? `${Math.floor(currentTime)}/${Math.floor(duration)} sekund`
                : "Ładowanie..."}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
