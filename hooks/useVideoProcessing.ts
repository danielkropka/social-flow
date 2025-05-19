import { useState, useEffect, useRef, useCallback } from "react";

interface VideoProcessingOptions {
  onError?: (error: Error) => void;
  timeout?: number;
}

export function useVideoProcessing({
  onError,
  timeout = 10000,
}: VideoProcessingOptions = {}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleError = useCallback(
    (error: Error) => {
      if (error.message !== error?.message) {
        setError(error);
        onError?.(error);
      }
    },
    [onError, error?.message]
  );

  const loadVideo = useCallback(
    async (file: File) => {
      try {
        setError(null);
        setIsReady(false);

        // Tworzymy nowy element wideo
        const video = document.createElement("video");
        video.style.display = "none";
        document.body.appendChild(video);
        videoRef.current = video;

        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;

        await new Promise<void>((resolve, reject) => {
          const handleLoadedData = () => {
            setIsReady(true);
            setDuration(video.duration || 0);
            resolve();
          };

          const handleError = () => {
            reject(new Error("Błąd ładowania wideo"));
          };

          video.addEventListener("loadeddata", handleLoadedData);
          video.addEventListener("error", handleError);

          // Cleanup
          return () => {
            video.removeEventListener("loadeddata", handleLoadedData);
            video.removeEventListener("error", handleError);
            URL.revokeObjectURL(videoUrl);
            document.body.removeChild(video);
            videoRef.current = null;
          };
        });
      } catch (error) {
        handleError(
          error instanceof Error ? error : new Error("Nieznany błąd")
        );
        throw error;
      }
    },
    [handleError]
  );

  const reset = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.load();
    }
    setIsReady(false);
    setError(null);
    setDuration(0);
  }, []);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    videoRef,
    isReady,
    error,
    duration,
    loadVideo,
    reset,
  };
}
