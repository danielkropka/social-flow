import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";

interface ImageLimitWarning {
  name: string;
  limit: number;
  platform: string;
}

interface ImagePreviewSectionProps {
  selectedFiles: File[];
  selectedPreviewIndex: number;
  setSelectedPreviewIndex: Dispatch<SetStateAction<number>>;
  imageLimitWarnings: ImageLimitWarning[];
}

export function ImagePreviewSection({
  selectedFiles,
  selectedPreviewIndex,
  setSelectedPreviewIndex,
  imageLimitWarnings,
}: ImagePreviewSectionProps) {
  return (
    <div className="mb-4">
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Podgląd obrazu</h3>
          <span className="text-sm text-gray-500">
            {selectedPreviewIndex + 1} z {selectedFiles.length}
          </span>
        </div>
        {imageLimitWarnings.length > 0 && (
          <div className="space-y-2 mb-4">
            {imageLimitWarnings.map((warning) => (
              <div
                key={warning.platform}
                className="flex items-center gap-2 bg-yellow-100 text-yellow-800 rounded-md px-3 py-2 text-sm"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>
                  Tylko pierwsze <b>{warning.limit}</b> zdjęć zostanie
                  opublikowanych na platformie <b>{warning.name}</b>
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="flex items-center justify-center bg-gray-50 rounded-lg w-full aspect-[4/3] overflow-hidden">
            {selectedFiles[selectedPreviewIndex] && (
              <img
                src={URL.createObjectURL(selectedFiles[selectedPreviewIndex])}
                alt="Pełny obraz"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          {selectedFiles.length > 1 && (
            <div className="flex justify-between items-center gap-4 mt-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedPreviewIndex((prev) =>
                    prev === 0 ? selectedFiles.length - 1 : prev - 1
                  )
                }
                className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-blue-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {selectedFiles.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPreviewIndex(index)}
                    className={`h-2 rounded-full transition-all duration-500 ease-in-out transform ${
                      selectedPreviewIndex === index
                        ? "bg-blue-600 w-8 scale-110"
                        : "bg-gray-300 hover:bg-gray-400 w-2 hover:scale-110"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPreviewIndex((prev) =>
                    prev === selectedFiles.length - 1 ? 0 : prev + 1
                  )
                }
                className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-blue-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
