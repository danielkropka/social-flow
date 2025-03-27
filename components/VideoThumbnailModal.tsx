import { useState, useEffect, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "./ui/dialog";
import { Slider } from "./ui/slider";
import Image from "next/image";
import { Button } from "./ui/button";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";

interface VideoThumbnailModalProps {
  isOpen: boolean;
  videoFile: File;
  currentThumbnail: string;
  onClose: () => void;
}

export function VideoThumbnailModal({
  isOpen,
  videoFile,
  currentThumbnail,
  onClose,
}: VideoThumbnailModalProps) {
  const { setThumbnailUrl } = usePostCreation();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen || !videoFile) {
      setVideoUrl(null);
      setIsReady(false);
      setIsLoading(true);
      return;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoUrl(objectUrl);
    setIsLoading(true);

    const video = videoRef.current;
    if (!video) return;

    // Wymuszamy przeładowanie wideo
    video.load();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setVideoUrl(null);
      setIsReady(false);
      setError(false);
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [isOpen, videoFile]);

  const handleTimeUpdate = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current && isReady) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleCaptureThumbnail = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement("canvas");

      // Używamy oryginalnych wymiarów wideo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Nie udało się utworzyć kontekstu canvas");
      }

      // Rysujemy wideo w oryginalnym rozmiarze
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const thumbnail = canvas.toDataURL("image/jpeg", 1.0);

      setThumbnailUrl(thumbnail);
      toast.success("Nowa miniaturka została zapisana!");
      onClose();
    } catch (_err) {
      toast.error("Nie udało się utworzyć miniaturki");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Wybierz miniaturkę</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-sm font-medium text-gray-500 text-left">
              Nowa miniaturka
            </p>
            <div className="w-full h-[400px] bg-black rounded-md overflow-hidden relative flex items-center justify-center">
              {error ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">
                    Błąd odtwarzania wideo
                  </p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    className="absolute inset-0 w-full h-full object-contain rounded-md"
                    style={{
                      objectPosition: "top center",
                      maxHeight: "100%",
                      width: "auto",
                      margin: "0 auto",
                    }}
                    preload="auto"
                    playsInline
                    onLoadStart={() => {
                      setIsLoading(true);
                      setIsReady(false);
                    }}
                    onLoadedData={() => {
                      if (
                        videoRef.current?.duration &&
                        videoRef.current.duration > 0
                      ) {
                        setDuration(videoRef.current.duration);
                        setIsReady(true);
                        setIsLoading(false);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                    }}
                    onCanPlay={() => {
                      if (
                        videoRef.current?.duration &&
                        videoRef.current.duration > 0
                      ) {
                        setDuration(videoRef.current.duration);
                        setIsReady(true);
                        setIsLoading(false);
                      }
                    }}
                    onError={(e) => {
                      console.error("Video error:", e);
                      setError(true);
                      setIsReady(false);
                      setIsLoading(false);
                      toast.error("Nie udało się załadować wideo");
                    }}
                    onTimeUpdate={(e) => {
                      const video = e.target as HTMLVideoElement;
                      setCurrentTime(video.currentTime);
                    }}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <p className="text-white text-sm">Ładowanie wideo...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-sm font-medium text-gray-500">
              Aktualna miniaturka
            </p>
            <div className="w-full h-[400px] bg-black rounded-md overflow-hidden relative flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={currentThumbnail}
                  alt="Aktualna miniaturka"
                  className="rounded-md object-contain"
                  style={{
                    objectPosition: "top center",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    margin: "auto",
                  }}
                  width={1920}
                  height={1080}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.001}
              onValueChange={handleTimeUpdate}
              className="w-full"
              disabled={!isReady || error}
            />
            <div className="text-sm text-gray-500 text-center">
              {isLoading
                ? "Ładowanie..."
                : error
                ? "Błąd odtwarzania wideo"
                : `${Math.floor(currentTime)}/${Math.floor(duration)} sekund`}
            </div>
          </div>
          <div className="col-span-2 flex justify-end">
            <Button variant="secondary" onClick={onClose} className="mr-2">
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={handleCaptureThumbnail}
              disabled={!isReady || error}
            >
              Zapisz miniaturkę
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
