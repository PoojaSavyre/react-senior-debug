/**
 * useApiCache - React hook for cached API calls with strategy selection.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CacheManager } from '../services/cache/CacheManager';
import { cacheFirst, networkFirst, staleWhileRevalidate } from '../services/cache/strategies';

// Shared cache instance
const globalCache = new CacheManager({ maxEntries: 200, defaultTTL: 60000 });

function useApiCache(fetchFn, options = {}) {
  const {
    cacheKey,
    strategy = 'cache-first',
    ttl = 60000,
    tags = [],
    enabled = true,
    onSuccess = null,
    onError = null,
    staleTime = 0,
  } = options;

  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: false,
    isStale: false,
    source: null,
  });

  // Use ref for fetchFn to prevent stale closures in the effect
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Refs for callbacks to avoid resubscribing
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Memoize cache options to prevent dependency churn
  const cacheOptions = useMemo(
    () => ({ ttl, tags }),
    [ttl, JSON.stringify(tags)]
  );

  // Request counter — stale responses (from an older execute) are discarded
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!cacheKey) return;

    const myRequestId = ++requestIdRef.current;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Plain fetch — no abort signal.  The requestId guard handles staleness.
    const wrappedFetch = () => fetchFnRef.current();

    try {
      let result;

      switch (strategy) {
        case 'network-first':
          result = await networkFirst(globalCache, cacheKey, wrappedFetch, cacheOptions);
          break;
        case 'stale-while-revalidate':
          result = staleWhileRevalidate(globalCache, cacheKey, wrappedFetch, {
            ...cacheOptions,
            onRevalidated: (freshData) => {
              if (isMountedRef.current && requestIdRef.current === myRequestId) {
                setState((prev) => ({
                  ...prev,
                  data: freshData,
                  isStale: false,
                  source: 'network',
                }));
              }
            },
          });
          // staleWhileRevalidate may return a sync result or a promise
          if (result instanceof Promise) {
            result = await result;
          }
          break;
        case 'cache-first':
        default:
          result = await cacheFirst(globalCache, cacheKey, wrappedFetch, cacheOptions);
          break;
      }

      if (isMountedRef.current && requestIdRef.current === myRequestId) {
        setState({
          data: result.data,
          error: null,
          isLoading: false,
          isStale: result.stale || false,
          source: result.source,
        });

        if (onSuccessRef.current) {
          onSuccessRef.current(result.data);
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;

      if (isMountedRef.current && requestIdRef.current === myRequestId) {
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
        }));

        if (onErrorRef.current) {
          onErrorRef.current(error);
        }
      }
    }
  }, [cacheKey, strategy, cacheOptions]);

  // Auto-fetch when enabled and key changes
  useEffect(() => {
    if (enabled && cacheKey) {
      execute();
    }
  }, [enabled, cacheKey, execute]);

  const invalidate = useCallback(() => {
    if (cacheKey) {
      globalCache.invalidate(cacheKey);
    }
  }, [cacheKey]);

  const refetch = useCallback(() => {
    invalidate();
    return execute();
  }, [invalidate, execute]);

  return {
    ...state,
    refetch,
    invalidate,
    cacheStats: globalCache.getStats(),
  };
}

export { useApiCache, globalCache };
