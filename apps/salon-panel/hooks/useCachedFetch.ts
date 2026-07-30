import { useState, useEffect, useCallback } from "react";
import { getCached, setCache } from "@/lib/cache";
import { parseApiError, type ParsedApiError } from "@/lib/api-client";

interface UseCachedFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: ParsedApiError | null;
  refetch: () => Promise<void>;
}

export function useCachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<{ data: any }>,
  extractor: (res: any) => T,
  deps: unknown[] = [],
  ttl = 60000,
): UseCachedFetchResult<T> {
  const [data, setData] = useState<T | null>(() => getCached<T>(cacheKey, ttl));
  const [isLoading, setIsLoading] = useState(!getCached<T>(cacheKey, ttl));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<ParsedApiError | null>(null);

  const execute = useCallback(async () => {
    const cached = getCached<T>(cacheKey, ttl);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      // Still refresh in background
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
      const res = await fetcher();
      const extracted = extractor(res);
      setData(extracted);
      setCache(cacheKey, extracted);
    } catch (err) {
      if (!cached) setError(parseApiError(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, isLoading, isRefreshing, error, refetch: execute };
}