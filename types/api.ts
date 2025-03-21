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

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
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
