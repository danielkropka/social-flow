import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "./ui/dialog";
import { Slider } from "./ui/slider";
import Image from "next/image";
import { Button } from "./ui/button";
import { usePostCreation } from "@/context/PostCreationContext";
import { toast } from "sonner";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";

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
  const [currentTime, setCurrentTime] = useState(0);

  const {
    videoRef,
    isReady: isVideoReady,
    error: videoError,
    duration,
    createThumbnail,
  } = useVideoProcessing({
    onError: (error) => toast.error(error.message),
  });

  const handleTimeUpdate = (value: number[]) => {
    if (!videoRef.current) return;
    const newTime = value[0];
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleCaptureThumbnail = async () => {
    try {
      const thumbnail = await createThumbnail(currentTime);
      setThumbnailUrl(thumbnail);
      toast.success("Nowa miniaturka została zapisana!");
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error("Nie udało się zmienić miniaturki.");
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
              {videoError ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">
                    Błąd odtwarzania wideo
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover rounded-md shadow-md mx-auto"
                />
              )}
            </div>
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-gray-500">
              Aktualna miniaturka
            </p>
            <div className="w-3/4 h-4/5 overflow-hidden relative">
              <Image
                src={currentThumbnail}
                alt="Aktualna miniaturka"
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
              disabled={!isVideoReady || !!videoError}
            />
            <div className="text-sm text-gray-500 text-center">
              {!isVideoReady
                ? "Ładowanie..."
                : videoError
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
              disabled={!isVideoReady || !!videoError}
            >
              Zapisz miniaturkę
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
