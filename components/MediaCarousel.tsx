import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MediaPreview } from "@/components/MediaPreview";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MediaCarouselProps {
  files: File[];
  urls: string[];
}

export function MediaCarousel({ files, urls }: MediaCarouselProps) {
  const images = urls.filter((_, i) => !files[i].type.startsWith("video/"));
  const videos = urls.filter((_, i) => files[i].type.startsWith("video/"));

  return (
    <div className="grid grid-cols-1 gap-4">
      {videos.map((url, index) => (
        <div key={url} className="relative mx-auto">
          <video
            src={url}
            className="max-h-[50vh] mx-auto"
            preload="metadata"
            controls
            onLoadedData={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().then(() => video.pause());
            }}
          />
        </div>
      ))}

      {images.length > 0 && (
        <Carousel className="w-full relative mx-auto">
          <CarouselContent>
            {images.map((imgUrl, i) => (
              <CarouselItem key={imgUrl}>
                <img
                  src={imgUrl}
                  alt={files[i].name}
                  className="max-h-[50vh] mx-auto object-contain"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      )}
    </div>
  );
}
