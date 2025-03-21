import { useState, useCallback, useEffect } from "react";
import { ApiErrorHandler } from "@/lib/api";
import { toast } from "sonner";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiErrorHandler) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<{ success: boolean; data?: T }>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiErrorHandler | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiFunction(...args);
        setData(response.data || null);

        if (options.onSuccess) {
          options.onSuccess(response.data as T);
        }

        if (options.showSuccessToast && options.successMessage) {
          toast.success(options.successMessage);
        }

        return response;
      } catch (err) {
        const apiError = err as ApiErrorHandler;
        setError(apiError);

        if (options.onError) {
          options.onError(apiError);
        }

        if (options.showErrorToast) {
          toast.error(apiError.message);
        }

        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options]
  );

  useEffect(() => {
    execute();
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    isError: error !== null,
    isSuccess: data !== null && error === null,
  };
}

interface UseInfiniteApiOptions<T> extends UseApiOptions<T[]> {
  pageSize?: number;
  initialData?: T[];
}

export function useInfiniteApi<T>(
  apiFunction: (
    page: number,
    pageSize: number
  ) => Promise<{ success: boolean; data?: T[] }>,
  options: UseInfiniteApiOptions<T> = {}
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [error, setError] = useState<ApiErrorHandler | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = options.pageSize || 10;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFunction(page, pageSize);
      const newData = response.data || [];

      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData((prevData) => [...prevData, ...newData]);
      setPage((p) => p + 1);

      if (options.onSuccess) {
        options.onSuccess(newData);
      }
    } catch (err) {
      const apiError = err as ApiErrorHandler;
      setError(apiError);

      if (options.onError) {
        options.onError(apiError);
      }

      if (options.showErrorToast) {
        toast.error(apiError.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, page, pageSize, hasMore, isLoading, options]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    await loadMore();
  }, [loadMore]);

  return {
    data,
    error,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    isError: error !== null,
    isSuccess: data.length > 0 && error === null,
  };
}

interface UsePollingApiOptions<T> extends UseApiOptions<T> {
  interval?: number;
  enabled?: boolean;
}

export function usePollingApi<T>(
  apiFunction: () => Promise<{ success: boolean; data?: T }>,
  options: UsePollingApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiErrorHandler | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const poll = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFunction();
      setData(response.data || null);
      setError(null);

      if (options.onSuccess) {
        options.onSuccess(response.data as T);
      }
    } catch (err) {
      const apiError = err as ApiErrorHandler;
      setError(apiError);

      if (options.onError) {
        options.onError(apiError);
      }

      if (options.showErrorToast) {
        toast.error(apiError.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, options]);

  useEffect(() => {
    if (options.enabled === false) return;

    poll();
    const interval = setInterval(poll, options.interval || 5000);

    return () => clearInterval(interval);
  }, [poll, options.enabled, options.interval]);

  return {
    data,
    error,
    isLoading,
    refresh: poll,
    isError: error !== null,
    isSuccess: data !== null && error === null,
  };
}
