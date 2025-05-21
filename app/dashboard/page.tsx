"use client";

import { usePostCreation } from "@/context/PostCreationContext";
import { PostCreationForm } from "@/components/posts/PostCreationForm";
import { PostTypeSelectionStep } from "@/components/posts/PostTypeSelectionStep";
import { useTab } from "@/context/TabContext";
import { useRouter } from "next/navigation";

export default function DashboardContent() {
  const { currentStep } = usePostCreation();
  const router = useRouter();
  const { setActiveTab } = useTab();

  return (
    <div>
      {currentStep === 1 && <PostTypeSelectionStep />}

      {currentStep === 2 && (
        <PostCreationForm
          onPublish={() => {
            router.push("/dashboard");
            setActiveTab("posts");
          }}
        />
      )}
    </div>
  );
}
