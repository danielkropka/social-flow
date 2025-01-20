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
  selectedAccounts: string[];
  postText: PostText;
  scheduledDate: Date | undefined;
  currentStep: number;
  content: string;
  mediaUrls: string[];
  isTextOnly: boolean;
  thumbnailUrl: string | null;
  setSelectedFiles: (files: File[]) => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setPostText: (text: PostText) => void;
  setScheduledDate: (date: Date | undefined) => void;
  setCurrentStep: (step: number) => void;
  setContent: (content: string) => void;
  setMediaUrls: (urls: string[]) => void;
  setIsTextOnly: (value: boolean) => void;
  setThumbnailUrl: (url: string | null) => void;
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
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [postText, setPostText] = useState<PostText>({ default: "" });
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isTextOnly, setIsTextOnly] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  return (
    <PostCreationContext.Provider
      value={{
        selectedFiles,
        selectedAccounts,
        postText,
        scheduledDate,
        currentStep,
        mediaUrls,
        content,
        isTextOnly,
        thumbnailUrl,
        setSelectedFiles,
        setSelectedAccounts,
        setPostText,
        setScheduledDate,
        setCurrentStep,
        setContent,
        setMediaUrls,
        setIsTextOnly,
        setThumbnailUrl,
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
