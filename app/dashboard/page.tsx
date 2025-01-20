"use client";

import { PostDetailsStep } from "@/components/steps/PostDetailsStep";
import { usePostCreation } from "@/context/PostCreationContext";
import { FileUploadStep } from "@/components/steps/FileUploadStep";
import { StepsProgress } from "@/components/StepsProgress";
import { AccountSelectionStep } from "@/components/steps/AccountSelectionStep";
import { toast } from "sonner";

export default function DashboardContent() {
  const { currentStep, scheduledDate } = usePostCreation();

  const steps = [
    { number: 1, title: "Wybierz plik" },
    { number: 2, title: "Wybierz konta" },
    { number: 3, title: "Szczegóły" },
  ];

  return (
    <div>
      {currentStep !== 1 && (
        <StepsProgress steps={steps} currentStep={currentStep} />
      )}
      {currentStep === 1 && <FileUploadStep />}

      {currentStep === 2 && <AccountSelectionStep />}

      {currentStep === 3 && (
        <PostDetailsStep
          onPublish={() => {
            if (scheduledDate) {
              toast.success(
                `Post został zaplanowany na ${scheduledDate.toLocaleString()}`
              );
            } else {
              toast.success("Post został opublikowany!");
            }
          }}
        />
      )}
    </div>
  );
}
