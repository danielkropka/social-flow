"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { PublicSocialAccount, UploadedFileData } from "@/types";

interface PostText {
  default: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

export interface PostCreationState {
  selectedFiles: UploadedFileData[];
  selectedAccounts: PublicSocialAccount[];
  postText: PostText;
  scheduledDate: Date | undefined;
  currentStep: number;
  isTextOnly: boolean;
  postType: "images" | "video" | "text" | null;
  isSheetOpen: boolean;
}

type PostCreationAction =
  | { type: "SET_SELECTED_FILES"; payload: UploadedFileData[] }
  | { type: "SET_SELECTED_ACCOUNTS"; payload: PublicSocialAccount[] }
  | { type: "SET_POST_TEXT"; payload: PostText }
  | { type: "SET_SCHEDULED_DATE"; payload: Date | undefined }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_IS_TEXT_ONLY"; payload: boolean }
  | { type: "SET_POST_TYPE"; payload: "images" | "video" | "text" | null }
  | { type: "SET_IS_SHEET_OPEN"; payload: boolean }
  | { type: "RESET_STATE" };

const initialState: PostCreationState = {
  selectedFiles: [],
  selectedAccounts: [],
  postText: {
    default: "",
  },
  scheduledDate: undefined,
  currentStep: 1,
  isTextOnly: false,
  postType: null,
  isSheetOpen: false,
};

function postCreationReducer(
  state: PostCreationState,
  action: PostCreationAction,
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
    case "SET_IS_TEXT_ONLY":
      return { ...state, isTextOnly: action.payload };
    case "SET_POST_TYPE":
      return { ...state, postType: action.payload };
    case "SET_IS_SHEET_OPEN":
      return { ...state, isSheetOpen: action.payload };
    case "RESET_STATE":
      return {
        selectedFiles: [],
        selectedAccounts: [],
        postText: {
          default: "",
        },
        scheduledDate: undefined,
        currentStep: 1,
        isTextOnly: false,
        postType: null,
        isSheetOpen: false,
      };
    default:
      return state;
  }
}

interface PostCreationContextType {
  state: PostCreationState;
  setSelectedFiles: (files: UploadedFileData[]) => void;
  setSelectedAccounts: (accounts: PublicSocialAccount[]) => void;
  setPostText: (text: PostText) => void;
  setScheduledDate: (date: Date | undefined) => void;
  setCurrentStep: (step: number) => void;
  setIsTextOnly: (value: boolean) => void;
  setPostType: (type: "images" | "video" | "text" | null) => void;
  setIsSheetOpen: (value: boolean) => void;
  resetState: () => void;
}

const PostCreationContext = createContext<PostCreationContextType | undefined>(
  undefined,
);

export function PostCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(postCreationReducer, initialState);

  const setSelectedFiles = useCallback((files: UploadedFileData[]) => {
    dispatch({ type: "SET_SELECTED_FILES", payload: files });
  }, []);

  const setSelectedAccounts = useCallback((accounts: PublicSocialAccount[]) => {
    dispatch({ type: "SET_SELECTED_ACCOUNTS", payload: accounts });
  }, []);

  const setPostText = useCallback((text: PostText) => {
    dispatch({ type: "SET_POST_TEXT", payload: text });
  }, []);

  const setScheduledDate = useCallback((date: Date | undefined) => {
    dispatch({ type: "SET_SCHEDULED_DATE", payload: date });
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, []);

  const setIsTextOnly = useCallback((value: boolean) => {
    dispatch({ type: "SET_IS_TEXT_ONLY", payload: value });
  }, []);

  const setPostType = useCallback(
    (type: "images" | "video" | "text" | null) => {
      dispatch({ type: "SET_POST_TYPE", payload: type });
    },
    [],
  );

  const setIsSheetOpen = useCallback((value: boolean) => {
    dispatch({ type: "SET_IS_SHEET_OPEN", payload: value });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, []);

  const value = useMemo(
    () => ({
      state,
      setSelectedFiles,
      setSelectedAccounts,
      setPostText,
      setScheduledDate,
      setCurrentStep,
      setIsTextOnly,
      setPostType,
      setIsSheetOpen,
      resetState,
    }),
    [
      state,
      setSelectedFiles,
      setSelectedAccounts,
      setPostText,
      setScheduledDate,
      setCurrentStep,
      setIsTextOnly,
      setPostType,
      setIsSheetOpen,
      resetState,
    ],
  );

  return (
    <PostCreationContext.Provider value={value}>
      {children}
    </PostCreationContext.Provider>
  );
}

export function usePostCreation() {
  const context = useContext(PostCreationContext);
  if (context === undefined) {
    throw new Error(
      "usePostCreation must be used within a PostCreationProvider",
    );
  }
  return {
    ...context.state,
    setSelectedFiles: context.setSelectedFiles,
    setSelectedAccounts: context.setSelectedAccounts,
    setPostText: context.setPostText,
    setScheduledDate: context.setScheduledDate,
    setCurrentStep: context.setCurrentStep,
    setIsTextOnly: context.setIsTextOnly,
    setPostType: context.setPostType,
    setIsSheetOpen: context.setIsSheetOpen,
    resetState: context.resetState,
  };
}
