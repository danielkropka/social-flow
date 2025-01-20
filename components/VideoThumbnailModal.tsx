import { useEffect, useRef, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "./ui/dialog";
import { Slider } from "./ui/slider";
import Image from "next/image";
import { Button } from "./ui/button";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";

interface VideoThumbnailModalProps {
  isOpen: boolean;
  videoUrl: string;
  currentThumbnail: string;
  onClose: () => void;
}

export function VideoThumbnailModal({
  isOpen,
  videoUrl,
  currentThumbnail,
  onClose,
}: VideoThumbnailModalProps) {
  const { setThumbnailUrl } = usePostCreation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setIsVideoReady(true);
      setDuration(videoRef.current.duration);
      videoRef.current.currentTime = currentTime;
    }
  };

  const handleTimeUpdate = (value: number[]) => {
    if (!videoRef.current) return;
    const newTime = value[0];

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const captureThumbnail = () => {
    try {
      if (!videoRef.current) throw new Error("Video not found");
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Context not found");
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL();
      setThumbnailUrl(dataUrl);

      toast.success("Nowa miniaturka została zapisana!");
      onClose();
    } catch (error) {
      toast.error("Nie udało się zmienić miniaturki");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Wybierz miniaturkę</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-gray-500 text-left">
              Nowa miniaturka
            </p>
            <div className="w-3/4 h-4/5 overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                className="w-full h-full object-cover rounded-md shadow-md mx-auto"
              />
            </div>
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-gray-500">
              Aktualna miniaturka
            </p>
            <div className="w-3/4 h-4/5 overflow-hidden relative">
              <Image
                src={currentThumbnail}
                alt="Current Thumbnail"
                className="rounded-md shadow-md"
                fill
              />
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
              disabled={!isVideoReady}
            />
            <div className="text-sm text-gray-500 text-center">
              {isVideoReady
                ? `${Math.floor(currentTime)}/${Math.floor(duration)} sekund`
                : "Ładowanie..."}
            </div>
          </div>
          <div className="col-span-2 flex justify-end">
            <Button variant="secondary" onClick={onClose} className="mr-2">
              Anuluj
            </Button>
            <Button type="button" onClick={captureThumbnail}>
              Zapisz miniaturkę
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
