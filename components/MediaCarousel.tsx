import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MediaPreview } from "./MediaPreview";

interface MediaCarouselProps {
  files: File[];
  urls: string[];
}

export function MediaCarousel({ files, urls }: MediaCarouselProps) {
  const images = urls.filter((_, i) => !files[i].type.startsWith("video/"));
  const videos = urls.filter((_, i) => files[i].type.startsWith("video/"));

  return (
    <div className="grid grid-cols-1 gap-4">
      {videos.map((url, i) => (
        <MediaPreview
          key={url}
          file={files[i]}
          previewUrl={url}
          className="max-h-[50vh] mx-auto"
        />
      ))}

      {images.length > 0 && (
        <Carousel className="w-full relative mx-auto">
          <CarouselContent>
            {images.map((imgUrl, i) => (
              <CarouselItem key={imgUrl}>
                <MediaPreview
                  file={files[i]}
                  previewUrl={imgUrl}
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
