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
      setError(error);
      onError?.(error);
    },
    [onError]
  );

  const createThumbnail = useCallback(
    async (currentTime = 0): Promise<string> => {
      if (!videoRef.current) {
        throw new Error("Nie znaleziono wideo");
      }

      const video = videoRef.current;

      if (video.readyState < 2) {
        throw new Error("Wideo nie jest jeszcze gotowe");
      }

      try {
        // Ustawiamy czas wideo
        video.currentTime = currentTime;

        // Czekamy na zaktualizowanie klatki
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Przekroczono czas oczekiwania na klatkę wideo"));
          }, timeout);

          video.onseeked = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        });

        // Tworzymy miniaturkę
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Nie udało się utworzyć kontekstu canvas");
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        if (!dataUrl) {
          throw new Error("Nie udało się utworzyć miniaturki");
        }

        return dataUrl;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Wystąpił nieznany błąd podczas tworzenia miniaturki");
      }
    },
    [timeout]
  );

  const loadVideo = useCallback(
    async (file: File): Promise<string> => {
      try {
        const videoBlob = new Blob([file], { type: file.type });
        const videoUrl = URL.createObjectURL(videoBlob);

        // Tworzymy nowy element video
        const video = document.createElement("video");
        video.style.display = "none";
        document.body.appendChild(video);
        videoRef.current = video;

        videoRef.current.src = videoUrl;

        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Przekroczono czas oczekiwania na wideo"));
          }, timeout);

          if (!videoRef.current) {
            clearTimeout(timeoutId);
            reject(new Error("Nie znaleziono elementu wideo"));
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            setDuration(videoRef.current?.duration || 0);
            setIsReady(true);
            resolve();
          };

          videoRef.current.onerror = () => {
            clearTimeout(timeoutId);
            const error = new Error(
              `Błąd wideo: ${
                videoRef.current?.error?.message || "Nieznany błąd"
              }`
            );
            reject(error);
          };
        });

        return videoUrl;
      } catch (error) {
        if (error instanceof Error) {
          handleError(error);
          throw error;
        }
        const unknownError = new Error(
          "Wystąpił nieznany błąd podczas ładowania wideo"
        );
        handleError(unknownError);
        throw unknownError;
      }
    },
    [timeout, handleError]
  );

  const reset = useCallback(() => {
    setIsReady(false);
    setError(null);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current = null;
    }
  }, []);

  return {
    videoRef,
    isReady,
    error,
    duration,
    loadVideo,
    createThumbnail,
    reset,
  };
}
