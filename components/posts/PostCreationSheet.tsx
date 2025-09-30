"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { usePostCreation } from "@/context/PostCreationContext";
import TypeSelectionSheet from "./TypeSelectionSheet";
import AccountSelectionSheet from "./AccountSelectionSheet";
import PublishPostSheet from "./PublishPostSheet";
import { XIcon } from "lucide-react";

export default function PostCreationSheet() {
  const { isSheetOpen, setIsSheetOpen, currentStep } = usePostCreation();

  const handleClose = () => {
    setIsSheetOpen(false);
  };

  const steps = [
    {
      id: 1,
      label: "Typ",
      title: "Wybierz typ posta",
      desc: "Wybierz, co chcesz opublikować. Dostępne platformy różnią się w zależności od typu.",
    },
    {
      id: 2,
      label: "Konta",
      title: "Wybierz konta",
      desc: "Wybierz konta społecznościowe, na których chcesz opublikować post.",
    },
    {
      id: 3,
      label: "Publikacja",
      title: "Finalizuj publikację",
      desc: "Napisz treść posta, dodaj media i opublikuj na wybranych platformach.",
    },
  ];

  const active = steps.find((s) => s.id === currentStep) ?? steps[0];

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0"
      >
        {/* Sticky header with glass effect */}
        <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b border-gray-200/70 dark:border-gray-800/70">
          <SheetHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {active.title}
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {active.desc}
                </SheetDescription>
              </div>

              <XIcon
                aria-label="Zamknij"
                onClick={handleClose}
                className="hover:cursor-pointer hover:text-gray-700 hover:border rounded hover:border-gray-100 text-gray-950"
              />
            </div>
          </SheetHeader>
        </div>

        {/* Content area */}
        <div className="px-5 sm:px-6 py-6">
          {/* Step content card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 shadow-sm">
            <div className="p-4 sm:p-6">
              {currentStep === 1 && <TypeSelectionSheet />}
              {currentStep === 2 && (
                <AccountSelectionSheet onClose={handleClose} />
              )}
              {currentStep === 3 && <PublishPostSheet onClose={handleClose} />}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
