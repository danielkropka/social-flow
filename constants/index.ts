export const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

export const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
} as const;

export const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
} as const;

export const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
} as const;

export const ALLOWED_EXTENSIONS = [
  ...Object.values(ACCEPTED_FILE_TYPES).flat(),
];

export const MAX_IMAGE_DIMENSION = 4096; // maksymalny wymiar obrazu w pikselach
export const MAX_VIDEO_DURATION = 600; // maksymalny czas trwania wideo w sekundach
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // maksymalny rozmiar wideo (500MB)

export const DEFAULT_IMAGE_QUALITY = 85;

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
    minVideoDuration: 3, // 3 seconds
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

export const API_ENDPOINTS = {
  ACCOUNTS: "/api/accounts",
  MEDIA: "/api/media",
  AUTH: "/api/auth",
} as const;

export const API_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export const API_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
} as const;

export const API_CONTENT_TYPES = {
  JSON: "application/json",
  MULTIPART: "multipart/form-data",
} as const;

export const API_TIMEOUT = 30000; // 30 sekund

export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 sekunda

export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  VIDEO_TOO_LONG: "VIDEO_TOO_LONG",
  TEXT_TOO_LONG: "TEXT_TOO_LONG",
  NO_ACCOUNTS_SELECTED: "NO_ACCOUNTS_SELECTED",
  PUBLISH_ERROR: "PUBLISH_ERROR",
  FETCH_ERROR: "FETCH_ERROR",
  INVALID_DATE: "INVALID_DATE",
  INVALID_TIME: "INVALID_TIME",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export const API_ERROR_MESSAGES = {
  [API_ERROR_CODES.VALIDATION_ERROR]: "Błąd walidacji danych",
  [API_ERROR_CODES.FILE_TOO_LARGE]:
    "Plik przekracza maksymalny dozwolony rozmiar",
  [API_ERROR_CODES.INVALID_FILE_TYPE]: "Nieprawidłowy typ pliku",
  [API_ERROR_CODES.VIDEO_TOO_LONG]:
    "Film przekracza maksymalny dozwolony czas trwania",
  [API_ERROR_CODES.TEXT_TOO_LONG]:
    "Tekst przekracza maksymalną dozwoloną długość",
  [API_ERROR_CODES.NO_ACCOUNTS_SELECTED]:
    "Wybierz przynajmniej jedno konto do publikacji",
  [API_ERROR_CODES.PUBLISH_ERROR]: "Wystąpił błąd podczas publikowania posta",
  [API_ERROR_CODES.FETCH_ERROR]: "Nie udało się pobrać postów",
  [API_ERROR_CODES.INVALID_DATE]: "Nieprawidłowa data",
  [API_ERROR_CODES.INVALID_TIME]: "Nieprawidłowa godzina",
  [API_ERROR_CODES.UNAUTHORIZED]: "Brak autoryzacji",
  [API_ERROR_CODES.FORBIDDEN]: "Brak uprawnień",
  [API_ERROR_CODES.NOT_FOUND]: "Nie znaleziono zasobu",
  [API_ERROR_CODES.INTERNAL_ERROR]: "Wystąpił błąd wewnętrzny serwera",
} as const;

export const API_SUCCESS_MESSAGES = {
  POST_PUBLISHED: "Post został opublikowany pomyślnie",
  POST_SCHEDULED: "Post został zaplanowany pomyślnie",
  THUMBNAIL_SAVED: "Nowa miniaturka została zapisana",
  ACCOUNT_CONNECTED: "Konto zostało połączone pomyślnie",
  ACCOUNT_DISCONNECTED: "Konto zostało odłączone pomyślnie",
  SETTINGS_UPDATED: "Ustawienia zostały zaktualizowane pomyślnie",
} as const;
