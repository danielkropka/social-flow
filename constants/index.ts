import { SiFacebook, SiInstagram, SiX, SiTiktok } from "react-icons/si";

export const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

export const SUPPORTED_PLATFORMS = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TWITTER: "twitter",
  TIKTOK: "tiktok",
} as const;

export type SupportedPlatform =
  (typeof SUPPORTED_PLATFORMS)[keyof typeof SUPPORTED_PLATFORMS];

export const PLATFORM_LIMITS = {
  [SUPPORTED_PLATFORMS.FACEBOOK]: {
    maxImageSize: 4 * 1024 * 1024, // 4MB
    maxVideoSize: 1024 * 1024 * 1024, // 1GB
    maxVideoDuration: 600, // 10 minut
    maxTextLength: 63206,
    maxMediaCount: 10,
  },
  [SUPPORTED_PLATFORMS.INSTAGRAM]: {
    maxImageSize: 8 * 1024 * 1024, // 8MB
    maxVideoSize: 250 * 1024 * 1024, // 250MB
    maxVideoDuration: 60 * 2, // 2 minutes
    maxTextLength: 2200,
    maxMediaCount: 10,
  },
  [SUPPORTED_PLATFORMS.TWITTER]: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxVideoSize: 512 * 1024 * 1024, // 512MB
    maxVideoDuration: 600, // 10 minut
    maxTextLength: 280,
    maxMediaCount: 4,
  },
  [SUPPORTED_PLATFORMS.TIKTOK]: {
    maxImageSize: 8 * 1024 * 1024, // 8MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    maxVideoDuration: 60, // 1 minuta
    maxTextLength: 2200,
    maxMediaCount: 35,
  },
} as const;

export const PLATFORM_DISPLAY = {
  [SUPPORTED_PLATFORMS.FACEBOOK]: {
    icon: SiFacebook,
    color: "text-[#1877F2]",
    label: "Facebook",
    description: "Posty, zdjęcia i filmy",
    maxChars: 60000,
    strokeColor: "#1877F2",
  },
  [SUPPORTED_PLATFORMS.INSTAGRAM]: {
    icon: SiInstagram,
    color: "text-[#E4405F]",
    label: "Instagram",
    description: "Reels'y i posty",
    maxChars: 2200,
    strokeColor: "#E4405F",
  },
  [SUPPORTED_PLATFORMS.TWITTER]: {
    icon: SiX,
    color: "text-[#1DA1F2]",
    label: "Twitter",
    description: "Tweetowanie",
    maxChars: 280,
    strokeColor: "#1DA1F2",
  },
  [SUPPORTED_PLATFORMS.TIKTOK]: {
    icon: SiTiktok,
    color: "text-[#000000]",
    label: "TikTok",
    description: "Krótkie filmy i treści wideo",
    maxChars: 2200,
    strokeColor: "#000000",
  },
} as const;
