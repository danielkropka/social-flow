"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

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
  isTextOnly: boolean;
}

type PostCreationAction =
  | { type: "SET_SELECTED_FILES"; payload: File[] }
  | { type: "SET_SELECTED_ACCOUNTS"; payload: SocialAccount[] }
  | { type: "SET_POST_TEXT"; payload: PostText }
  | { type: "SET_SCHEDULED_DATE"; payload: Date | undefined }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_IS_TEXT_ONLY"; payload: boolean }
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
  isTextOnly: false,
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
    case "SET_IS_TEXT_ONLY":
      return { ...state, isTextOnly: action.payload };
    case "RESET_STATE":
      return {
        selectedFiles: [],
        selectedAccounts: [],
        postText: {
          default: "",
        },
        scheduledDate: undefined,
        currentStep: 1,
        content: "",
        isTextOnly: false,
      };
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
  setIsTextOnly: (value: boolean) => void;
  resetState: () => void;
}

const PostCreationContext = createContext<PostCreationContextType | undefined>(
  undefined
);

export function PostCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(postCreationReducer, initialState);

  const setSelectedFiles = useCallback((files: File[]) => {
    dispatch({ type: "SET_SELECTED_FILES", payload: files });
  }, []);

  const setSelectedAccounts = useCallback((accounts: SocialAccount[]) => {
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

  const setContent = useCallback((content: string) => {
    dispatch({ type: "SET_CONTENT", payload: content });
  }, []);

  const setIsTextOnly = useCallback((value: boolean) => {
    dispatch({ type: "SET_IS_TEXT_ONLY", payload: value });
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
      setContent,
      setIsTextOnly,
      resetState,
    }),
    [
      state,
      setSelectedFiles,
      setSelectedAccounts,
      setPostText,
      setScheduledDate,
      setCurrentStep,
      setContent,
      setIsTextOnly,
      resetState,
    ]
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
    setIsTextOnly: context.setIsTextOnly,
    resetState: context.resetState,
  };
}
