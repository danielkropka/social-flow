import {
  ConnectedAccount,
  Media,
  Post,
  PostConnectedAccount,
} from "@prisma/client";

export type PublicSocialAccount = Omit<
  ConnectedAccount,
  | "platformData"
  | "tokenType"
  | "oauthTokenSecret"
  | "accessToken"
  | "accessSecret"
  | "refreshToken"
  | "accessTokenExpiresAt"
  | "scope"
  | "lastErrorAt"
  | "lastErrorMessage"
>;

// Safe account type for API responses - excludes all sensitive data
export type SafeAccount = {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  status: string;
  connectedAt: Date;
  revokedAt: Date | null;
  lastSyncedAt: Date | null;
  lastPublishAt: Date | null;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  profileUrl: string | null;
  locale: string | null;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type PublicPost = Post & {
  media: Media[];
  postConnectedAccounts: (PostConnectedAccount & {
    connectedAccount: PublicSocialAccount;
  })[];
};

export interface UploadedFileData {
  file: File;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface MediaUploadResponse {
  url: string;
}
