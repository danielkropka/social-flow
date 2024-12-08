"use client";

import { createContext, useContext, useState } from "react";

type PostText = {
  default: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
};

interface PostCreationContextType {
  selectedFiles: File[];
  previewUrls: string[];
  selectedAccounts: string[];
  postText: PostText;
  scheduledDate: Date | undefined;
  currentStep: number;
  setSelectedFiles: (files: File[]) => void;
  setPreviewUrls: (urls: string[]) => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setPostText: (text: PostText) => void;
  setScheduledDate: (date: Date | undefined) => void;
  setCurrentStep: (step: number) => void;
}

const PostCreationContext = createContext<PostCreationContextType | undefined>(
  undefined
);

export function PostCreationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [postText, setPostText] = useState<PostText>({ default: "" });
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <PostCreationContext.Provider
      value={{
        selectedFiles,
        previewUrls,
        selectedAccounts,
        postText,
        scheduledDate,
        currentStep,
        setSelectedFiles,
        setPreviewUrls,
        setSelectedAccounts,
        setPostText,
        setScheduledDate,
        setCurrentStep,
      }}
    >
      {children}
    </PostCreationContext.Provider>
  );
}

export function usePostCreation() {
  const context = useContext(PostCreationContext);
  if (context === undefined) {
    throw new Error(
      "usePostCreation must be used within a PostCreationProvider"
    );
  }
  return context;
}
