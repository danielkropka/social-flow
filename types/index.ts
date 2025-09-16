export type SocialAccount = {
  id: string;
  platform: "facebook" | "instagram" | "twitter" | "tiktok";
  name: string;
  avatar: string;
  accountType: string;
};

export type SocialAccountWithUsername = SocialAccount & {
  username: string;
  provider: string;
  providerAccountId: string;
  followersCount?: number;
  lastUpdate?: string;
};
