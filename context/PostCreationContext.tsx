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
  content: string;
  mediaUrls: string[];
  setSelectedFiles: (files: File[]) => void;
  setPreviewUrls: (urls: string[]) => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setPostText: (text: PostText) => void;
  setScheduledDate: (date: Date | undefined) => void;
  setCurrentStep: (step: number) => void;
  setContent: (content: string) => void;
  setMediaUrls: (urls: string[]) => void;
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
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  return (
    <PostCreationContext.Provider
      value={{
        selectedFiles,
        previewUrls,
        selectedAccounts,
        postText,
        scheduledDate,
        currentStep,
        mediaUrls,
        content,
        setSelectedFiles,
        setPreviewUrls,
        setSelectedAccounts,
        setPostText,
        setScheduledDate,
        setCurrentStep,
        setContent,
        setMediaUrls,
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
