"use client";

import { usePostCreation } from "@/context/PostCreationContext";
import { PostCreationForm } from "@/components/posts/PostCreationForm";
import { PostTypeSelectionStep } from "@/components/posts/PostTypeSelectionStep";

export default function DashboardPage() {
  const { currentStep } = usePostCreation();

  return (
    <div>
      {currentStep === 1 && <PostTypeSelectionStep />}
      {currentStep === 2 && <PostCreationForm />}
    </div>
  );
}
