import { API_ENDPOINTS, API_METHODS, API_TIMEOUT } from "@/constants";
import { fetchApi } from "@/lib/api";
import { MediaType } from "@prisma/client";

export interface Post {
  id: string;
  content: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  media: {
    id: string;
    url: string;
    type: MediaType;
    thumbnailUrl: string | null;
  }[];
  postConnectedAccounts: {
    connectedAccount: {
      provider: string;
      name: string;
    };
  }[];
}

// Typy dla parametrów
interface CreatePostParams {
  content: string;
  mediaUrls: Array<{
    url: string;
    thumbnailUrl: string | null;
  }>;
  accountIds: string[];
  scheduledDate?: Date;
}

interface UpdatePostParams {
  content?: string;
  mediaUrls?: Array<{
    url: string;
    thumbnailUrl: string | null;
  }>;
  accountIds?: string[];
  scheduledDate?: Date | null;
}

// Funkcje API dla postów
export async function getPosts() {
  return fetchApi<Post[]>(API_ENDPOINTS.POSTS);
}

export async function getPost(id: string) {
  return fetchApi<Post>(`${API_ENDPOINTS.POSTS}/${id}`);
}

export async function createPost(params: CreatePostParams) {
  return fetchApi<Post>(API_ENDPOINTS.POSTS, {
    method: API_METHODS.POST,
    body: JSON.stringify(params),
  });
}

export async function updatePost(id: string, params: UpdatePostParams) {
  return fetchApi<Post>(`${API_ENDPOINTS.POSTS}/${id}`, {
    method: API_METHODS.PUT,
    body: JSON.stringify(params),
  });
}

export async function deletePost(id: string) {
  return fetchApi<void>(`${API_ENDPOINTS.POSTS}/${id}`, {
    method: API_METHODS.DELETE,
  });
}

// Funkcje API dla mediów
export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return fetchApi<{ url: string; thumbnailUrl: string | null }>(
    API_ENDPOINTS.MEDIA,
    {
      method: API_METHODS.POST,
      headers: {
        // Nie ustawiamy Content-Type, ponieważ przeglądarka zrobi to automatycznie dla FormData
      },
      body: formData,
    }
  );
}

export async function deleteMedia(url: string) {
  return fetchApi<void>(
    `${API_ENDPOINTS.MEDIA}?url=${encodeURIComponent(url)}`,
    {
      method: API_METHODS.DELETE,
    }
  );
}

// Funkcje API dla kont
export interface ConnectedAccount {
  id: string;
  provider: string;
  name: string;
  avatar: string;
}

export async function getConnectedAccounts() {
  return fetchApi<ConnectedAccount[]>(API_ENDPOINTS.ACCOUNTS);
}

export async function connectAccount(provider: string) {
  return fetchApi<ConnectedAccount>(
    `${API_ENDPOINTS.ACCOUNTS}/connect/${provider}`,
    {
      method: API_METHODS.POST,
    }
  );
}

export async function disconnectAccount(id: string) {
  return fetchApi<void>(`${API_ENDPOINTS.ACCOUNTS}/${id}`, {
    method: API_METHODS.DELETE,
  });
}

// Funkcja pomocnicza do ponowienia próby
/* async function retryOperation<T>(
  operation: () => Promise<T>,
  attempts: number = API_RETRY_ATTEMPTS,
  delay: number = API_RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      attempts > 1 &&
      error instanceof ApiErrorHandler &&
      error.code !== API_ERROR_CODES.VALIDATION_ERROR &&
      error.code !== API_ERROR_CODES.UNAUTHORIZED &&
      error.code !== API_ERROR_CODES.FORBIDDEN
    ) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryOperation(operation, attempts - 1, delay);
    }
    throw error;
  }
} */

// Funkcja do tworzenia kontrolera przerwania
export function createAbortController(timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}
