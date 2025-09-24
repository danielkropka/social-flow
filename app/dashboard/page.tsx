"use client";

import { usePostCreation } from "@/context/PostCreationContext";
import TypeSelection from "@/components/posts/TypeSelection";
import AccountSelection from "@/components/posts/AccountSelection";
import PublishPost from "@/components/posts/PublishPost";

export default function DashboardPage() {
  const { currentStep } = usePostCreation();

  return (
    <div>
      {currentStep === 1 && <TypeSelection />}
      {currentStep === 2 && <AccountSelection />}
      {currentStep === 3 && <PublishPost />}
    </div>
  );
}