import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { Upload, X, Trash, Image as ImageIcon } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { RefObject } from "react";

interface FileUploadSectionProps {
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  selectedPreviewIndex: number;
  setSelectedPreviewIndex: (idx: number) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  processFiles: (files: File[]) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  getSupportedFormats: () => string[];
  MAX_FILE_SIZE: number;
}

export function FileUploadSection({
  dragActive,
  selectedFiles,
  setSelectedFiles,
  selectedPreviewIndex,
  setSelectedPreviewIndex,
  fileInputRef,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  getSupportedFormats,
  MAX_FILE_SIZE,
}: FileUploadSectionProps) {
  // Funkcja do obsługi zmiany kolejności zdjęć
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newFiles = Array.from(selectedFiles);
    const [removed] = newFiles.splice(result.source.index, 1);
    newFiles.splice(result.destination.index, 0, removed);
    setSelectedFiles(newFiles);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl bg-gray-50 w-full mx-auto p-4 flex flex-col items-center transition-all duration-300 min-h-[200px]",
        dragActive
          ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
          : "border-gray-200",
        "hover:border-blue-500 hover:bg-blue-50/50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => {
        if (selectedFiles.length === 0) fileInputRef.current?.click();
      }}
      style={{ cursor: "pointer" }}
    >
      {selectedFiles.length > 0 ? (
        <>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="images-droppable" direction="horizontal">
              {(provided) => (
                <div
                  className="flex items-center gap-3 overflow-x-auto w-full mb-4 pb-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {selectedFiles.map((file, idx) => (
                    <Draggable
                      key={file.name + idx}
                      draggableId={file.name + idx}
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "w-24 h-24 flex-shrink-0 rounded-lg cursor-pointer relative group transition-all duration-200 mx-0.5 my-1",
                            selectedPreviewIndex === idx
                              ? "ring-2 ring-blue-400 scale-105"
                              : "hover:scale-105",
                            snapshot.isDragging && "z-50 shadow-lg scale-110"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPreviewIndex(idx);
                          }}
                        >
                          <div className="w-full h-full rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Podgląd ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-white hover:bg-red-600 absolute left-1 bottom-1 m-0 p-1"
                              style={{
                                position: "absolute",
                                left: 4,
                                bottom: 4,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFiles(
                                  selectedFiles.filter((_, i) => i !== idx)
                                );
                              }}
                            >
                              <Trash className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="flex w-full justify-center gap-3 md:flex-row flex-col">
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Dodaj więcej plików
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFiles([]);
              }}
              className="px-6"
            >
              <X className="h-4 w-4 mr-2" />
              Wyczyść wszystkie
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110">
            <ImageIcon className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-2xl font-medium text-gray-900 mb-2">
            Przeciągnij i upuść pliki
          </p>
          <p className="text-base text-gray-600 mb-4">
            lub kliknij, aby wybrać pliki
          </p>
          <div className="text-sm text-gray-500 space-y-3 bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span>Obsługiwane formaty:</span>
              <span className="font-medium text-gray-700">
                {getSupportedFormats().join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>Maksymalny rozmiar pliku:</span>
              <span className="font-medium text-gray-700">
                {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
