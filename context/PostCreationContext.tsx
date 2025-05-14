"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

interface PostText {
  default: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

interface SocialAccount {
  id: string;
  name: string;
  provider: string;
  username: string;
}

interface PostCreationState {
  selectedFiles: File[];
  selectedAccounts: SocialAccount[];
  postText: PostText;
  scheduledDate: Date | undefined;
  currentStep: number;
  content: string;
  mediaUrls: string[];
  isTextOnly: boolean;
  thumbnailUrl: string | null;
}

type PostCreationAction =
  | { type: "SET_SELECTED_FILES"; payload: File[] }
  | { type: "SET_SELECTED_ACCOUNTS"; payload: SocialAccount[] }
  | { type: "SET_POST_TEXT"; payload: PostText }
  | { type: "SET_SCHEDULED_DATE"; payload: Date | undefined }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_MEDIA_URLS"; payload: string[] }
  | { type: "SET_IS_TEXT_ONLY"; payload: boolean }
  | { type: "SET_THUMBNAIL_URL"; payload: string | null }
  | { type: "RESET_STATE" };

const initialState: PostCreationState = {
  selectedFiles: [],
  selectedAccounts: [],
  postText: {
    default: "",
  },
  scheduledDate: undefined,
  currentStep: 1,
  content: "",
  mediaUrls: [],
  isTextOnly: false,
  thumbnailUrl: null,
};

function postCreationReducer(
  state: PostCreationState,
  action: PostCreationAction
): PostCreationState {
  switch (action.type) {
    case "SET_SELECTED_FILES":
      return { ...state, selectedFiles: action.payload };
    case "SET_SELECTED_ACCOUNTS":
      return { ...state, selectedAccounts: action.payload };
    case "SET_POST_TEXT":
      return { ...state, postText: action.payload };
    case "SET_SCHEDULED_DATE":
      return { ...state, scheduledDate: action.payload };
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "SET_MEDIA_URLS":
      return { ...state, mediaUrls: action.payload };
    case "SET_IS_TEXT_ONLY":
      return { ...state, isTextOnly: action.payload };
    case "SET_THUMBNAIL_URL":
      return { ...state, thumbnailUrl: action.payload };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

interface PostCreationContextType {
  state: PostCreationState;
  setSelectedFiles: (files: File[]) => void;
  setSelectedAccounts: (accounts: SocialAccount[]) => void;
  setPostText: (text: PostText) => void;
  setScheduledDate: (date: Date | undefined) => void;
  setCurrentStep: (step: number) => void;
  setContent: (content: string) => void;
  setMediaUrls: (urls: string[]) => void;
  setIsTextOnly: (value: boolean) => void;
  setThumbnailUrl: (url: string | null) => void;
  resetState: () => void;
}

const PostCreationContext = createContext<PostCreationContextType | undefined>(
  undefined
);

export function PostCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(postCreationReducer, initialState);

  const setSelectedFiles = (files: File[]) => {
    dispatch({ type: "SET_SELECTED_FILES", payload: files });
  };

  const setSelectedAccounts = (accounts: SocialAccount[]) => {
    dispatch({ type: "SET_SELECTED_ACCOUNTS", payload: accounts });
  };

  const setPostText = (text: PostText) => {
    dispatch({ type: "SET_POST_TEXT", payload: text });
  };

  const setScheduledDate = (date: Date | undefined) => {
    dispatch({ type: "SET_SCHEDULED_DATE", payload: date });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  };

  const setContent = (content: string) => {
    dispatch({ type: "SET_CONTENT", payload: content });
  };

  const setMediaUrls = (urls: string[]) => {
    dispatch({ type: "SET_MEDIA_URLS", payload: urls });
  };

  const setIsTextOnly = (value: boolean) => {
    dispatch({ type: "SET_IS_TEXT_ONLY", payload: value });
  };

  const setThumbnailUrl = (url: string | null) => {
    dispatch({ type: "SET_THUMBNAIL_URL", payload: url });
  };

  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
  };

  return (
    <PostCreationContext.Provider
      value={{
        state,
        setSelectedFiles,
        setSelectedAccounts,
        setPostText,
        setScheduledDate,
        setCurrentStep,
        setContent,
        setMediaUrls,
        setIsTextOnly,
        setThumbnailUrl,
        resetState,
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
  return {
    ...context.state,
    setSelectedFiles: context.setSelectedFiles,
    setSelectedAccounts: context.setSelectedAccounts,
    setPostText: context.setPostText,
    setScheduledDate: context.setScheduledDate,
    setCurrentStep: context.setCurrentStep,
    setContent: context.setContent,
    setMediaUrls: context.setMediaUrls,
    setIsTextOnly: context.setIsTextOnly,
    setThumbnailUrl: context.setThumbnailUrl,
    resetState: context.resetState,
  };
}
