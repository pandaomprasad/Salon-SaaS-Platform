// ============================================================
// hooks/useApi.ts
// Reusable data-fetching & mutation hooks
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { parseApiError, type ParsedApiError } from "@/lib/api-client";

// ── Generic fetch hook ───────────────────

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ParsedApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches data on mount (and when deps change).
 *
 * Usage:
 *   const { data, isLoading } = useFetch(
 *     () => getBranches(salonId),
 *     [salonId]
 *   );
 */
export function useFetch<T>(
  fetcher: () => Promise<{ success: boolean; data: T }>,
  deps: unknown[] = [],
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ParsedApiError | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}

// ── Generic mutation hook ────────────────

interface UseMutationResult<TPayload, TResult> {
  mutate: (payload: TPayload) => Promise<TResult>;
  isLoading: boolean;
  error: ParsedApiError | null;
  reset: () => void;
}

/**
 * For create/update/delete actions.
 *
 * Usage:
 *   const { mutate, isLoading } = useMutation(
 *     (payload: CreateStaffPayload) => createStaff(branchId, payload)
 *   );
 *   await mutate({ name: "John", ... });
 */
export function useMutation<TPayload, TResult>(
  mutator: (payload: TPayload) => Promise<{ success: boolean; data: TResult }>,
): UseMutationResult<TPayload, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ParsedApiError | null>(null);

  const mutate = async (payload: TPayload): Promise<TResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mutator(payload);
      return res.data;
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      throw parsed;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error, reset: () => setError(null) };
}