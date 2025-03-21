import {
  ApiError,
  ApiResponse,
  API_ERROR_CODES,
  API_ERROR_MESSAGES,
  ApiErrorCode,
} from "@/types/api";

export class ApiErrorHandler extends Error {
  code: ApiErrorCode;
  details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiErrorHandler";
    this.code = code;
    this.details = details;
  }
}

export async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    let errorCode: ApiErrorCode = API_ERROR_CODES.INTERNAL_ERROR;
    let errorMessage = API_ERROR_MESSAGES[API_ERROR_CODES.INTERNAL_ERROR];

    switch (response.status) {
      case 400:
        errorCode = API_ERROR_CODES.VALIDATION_ERROR;
        errorMessage =
          errorData?.message ||
          API_ERROR_MESSAGES[API_ERROR_CODES.VALIDATION_ERROR];
        break;
      case 401:
        errorCode = API_ERROR_CODES.UNAUTHORIZED;
        errorMessage = API_ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED];
        break;
      case 403:
        errorCode = API_ERROR_CODES.FORBIDDEN;
        errorMessage = API_ERROR_MESSAGES[API_ERROR_CODES.FORBIDDEN];
        break;
      case 404:
        errorCode = API_ERROR_CODES.NOT_FOUND;
        errorMessage = API_ERROR_MESSAGES[API_ERROR_CODES.NOT_FOUND];
        break;
      case 413:
        errorCode = API_ERROR_CODES.FILE_TOO_LARGE;
        errorMessage = API_ERROR_MESSAGES[API_ERROR_CODES.FILE_TOO_LARGE];
        break;
      default:
        if (
          errorData?.code &&
          Object.values(API_ERROR_CODES).includes(errorData.code)
        ) {
          errorCode = errorData.code as ApiErrorCode;
          errorMessage = errorData.message;
        }
    }

    throw new ApiErrorHandler(errorCode, errorMessage, errorData?.details);
  }

  const data = await response.json();
  return {
    success: true,
    data,
  };
}

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      throw error;
    }

    throw new ApiErrorHandler(
      API_ERROR_CODES.INTERNAL_ERROR,
      API_ERROR_MESSAGES[API_ERROR_CODES.INTERNAL_ERROR],
      { originalError: error }
    );
  }
}

export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    code,
    message,
    details,
  };
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
