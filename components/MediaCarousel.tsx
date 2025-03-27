import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MediaPreview } from "./MediaPreview";
import { useMemo } from "react";

interface MediaCarouselProps {
  files: File[];
  urls: string[];
}

export function MediaCarousel({ files, urls }: MediaCarouselProps) {
  const { images, videos } = useMemo(() => {
    const images: { file: File; url: string }[] = [];
    const videos: { file: File; url: string }[] = [];

    files.forEach((file, index) => {
      if (index < urls.length) {
        const media = { file, url: urls[index] };
        if (file.type.startsWith("video/")) {
          videos.push(media);
        } else {
          images.push(media);
        }
      }
    });

    return { images, videos };
  }, [files, urls]);

  if (!files.length) {
    return (
      <div className="w-full h-48 bg-gray-50 flex items-center justify-center rounded-lg">
        <p className="text-gray-500 text-sm">Brak mediów do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {videos.map(({ file, url }, i) => (
        <MediaPreview
          key={`video-${i}`}
          file={file}
          previewUrl={url}
          className="max-h-[50vh] mx-auto"
        />
      ))}

      {images.length > 0 && (
        <Carousel className="w-full relative mx-auto">
          <CarouselContent>
            {images.map(({ file, url }, i) => (
              <CarouselItem key={`image-${i}`}>
                <MediaPreview
                  file={file}
                  previewUrl={url}
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
