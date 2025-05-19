"use client";

import { usePostCreation } from "@/context/PostCreationContext";
import { PostCreationForm } from "@/components/posts/PostCreationForm";
import { toast } from "sonner";
import { PostTypeSelectionStep } from "@/components/posts/PostTypeSelectionStep";

export default function DashboardContent() {
  const { currentStep, scheduledDate } = usePostCreation();

  return (
    <div>
      {currentStep === 1 && <PostTypeSelectionStep />}

      {currentStep === 2 && (
        <PostCreationForm
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
