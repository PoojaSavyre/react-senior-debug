/**
 * useSuspenseQuery - Hook that creates Suspense-compatible data fetching.
 * Uses the "throw promise" pattern for React Suspense.
 *
 * Competency: React Suspense for Data Fetching, React Hook Dependencies
 * Bug surface: suspense dependency array, stale data, abort signals,
 *              effect integration, loading states
 */

import { useRef } from 'react';

/**
 * Module-level cache that survives across renders and StrictMode remounts.
 * This mirrors the proven pattern where module-level state + throw-promise works.
 * Each entry is keyed by a unique Symbol created per hook instance + deps combination.
 */
const queryCache = new Map();

function useSuspenseQuery(fetchFn, deps = []) {
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Stable instance ID that persists across renders of the same component instance
  const instanceRef = useRef(Symbol('suspense-query'));
  const prevDepsRef = useRef(null);

  const depsChanged =
    !prevDepsRef.current ||
    deps.length !== prevDepsRef.current.length ||
    deps.some((d, i) => d !== prevDepsRef.current[i]);

  if (depsChanged) {
    prevDepsRef.current = deps;

    // Remove old entry (if deps changed, old data is stale)
    if (queryCache.has(instanceRef.current)) {
      queryCache.delete(instanceRef.current);
    }

    // Create fresh entry — this is the same pattern as the proven minimal test:
    //   entry object lives in module-level Map, promise mutates it on resolve
    const entry = { status: 'pending', data: null, error: null, promise: null };
    entry.promise = fetchFnRef.current()
      .then((d) => {
        entry.status = 'success';
        entry.data = d;
      })
      .catch((e) => {
        entry.status = 'error';
        entry.error = e;
      });

    queryCache.set(instanceRef.current, entry);
  }

  const entry = queryCache.get(instanceRef.current);

  // The Suspense contract: throw promise if pending, throw error if failed
  const read = () => {
    if (entry.status === 'pending') throw entry.promise;
    if (entry.status === 'error') throw entry.error;
    return entry.data;
  };

  const refresh = () => {
    // Force re-fetch by clearing deps so next render recreates
    prevDepsRef.current = null;
    queryCache.delete(instanceRef.current);
  };

  return {
    read,
    refresh,
    getStatus: () => entry?.status || 'pending',
  };
}

export { useSuspenseQuery };
