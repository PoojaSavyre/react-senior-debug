/**
 * Cache strategies: cache-first, network-first, stale-while-revalidate.
 *
 * Competency: API Response Caching
 * Bug surface: stale data, race conditions, error handling, rate limits
 */

/**
 * Cache-first strategy: returns cached data if available, otherwise fetches from network.
 */
async function cacheFirst(cacheManager, key, fetchFn, options = {}) {
  const cached = cacheManager.get(key);
  if (cached !== null) {
    return { data: cached, source: 'cache', stale: false };
  }

  const data = await fetchFn();
  cacheManager.set(key, data, options);
  return { data, source: 'network', stale: false };
}

/**
 * Network-first strategy: tries network first, falls back to cache on error.
 */
async function networkFirst(cacheManager, key, fetchFn, options = {}) {
  try {
    const data = await fetchFn();
    cacheManager.set(key, data, options);
    return { data, source: 'network', stale: false };
  } catch (error) {
    const cached = cacheManager.getStale(key);
    if (cached !== null) {
      return { data: cached, source: 'cache', stale: true, error };
    }
    throw error;
  }
}

/**
 * Stale-while-revalidate: returns cached data immediately (even if stale),
 * then fetches fresh data in background.
 */
function staleWhileRevalidate(cacheManager, key, fetchFn, options = {}) {
  const cached = cacheManager.getStale(key);
  const isFresh = cacheManager.has(key);

  // Track the original error so we can re-throw it properly
  let fetchError = null;

  // Start background revalidation
  const revalidatePromise = fetchFn()
    .then((data) => {
      cacheManager.set(key, data, options);
      if (options.onRevalidated) {
        options.onRevalidated(data);
      }
      return data;
    })
    .catch((error) => {
      fetchError = error;
      if (options.onRevalidateError) {
        options.onRevalidateError(error);
      }
      return null;
    });

  if (cached !== null) {
    return {
      data: cached,
      source: 'cache',
      stale: !isFresh,
      revalidating: revalidatePromise,
    };
  }

  // No cache at all - must wait for network
  return revalidatePromise.then((data) => {
    if (data === null) {
      // Re-throw the original error (preserves AbortError identity)
      throw fetchError || new Error('Network request failed and no cached data available');
    }
    return { data, source: 'network', stale: false, revalidating: null };
  });
}

export { cacheFirst, networkFirst, staleWhileRevalidate };
