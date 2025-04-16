export type Step = 1 | 2 | 3;

export type SocialAccount = {
  id: string;
  platform: "facebook" | "instagram" | "twitter" | "tiktok";
  name: string;
  avatar: string;
  accountType: string;
};
