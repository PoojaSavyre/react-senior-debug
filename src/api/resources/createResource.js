/**
 * createResource - Factory for Suspense-compatible data resources.
 * Implements the "throw promise" pattern that React Suspense requires.
 *
 * Competency: React Suspense for Data Fetching
 * Bug surface: incorrect data fetching, stale data, not updating on change,
 *              abort signals, error handling, dependency arrays, SSR compat
 */

const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

function createResource(fetchFn, options = {}) {
  const {
    cacheKey = null,
    ttl = 0,
    onError = null,
  } = options;

  let status = STATUS.PENDING;
  let result = null;
  let promise = null;
  let fetchedAt = 0;

  function load() {
    status = STATUS.PENDING;

    // Call fetchFn without a signal — keeps the Suspense contract simple.
    // The fetch always completes; no abort-related races to worry about.
    promise = fetchFn()
      .then((data) => {
        status = STATUS.SUCCESS;
        result = data;
        fetchedAt = Date.now();
      })
      .catch((error) => {
        // Silently ignore AbortErrors (e.g. from StrictMode cleanup upstream)
        if (error.name === 'AbortError') {
          // Stay PENDING — Suspense keeps showing fallback.
          // A subsequent read() after re-mount will call load() again.
          return;
        }
        status = STATUS.ERROR;
        result = error;
        if (onError) onError(error);
      });

    return promise;
  }

  // Initial load
  load();

  const resource = {
    /**
     * Read the resource value. Throws promise if pending, throws error if failed.
     * This is the Suspense integration point.
     */
    read() {
      switch (status) {
        case STATUS.PENDING:
          throw promise; // Suspense catches this
        case STATUS.ERROR:
          throw result;  // ErrorBoundary catches this
        case STATUS.SUCCESS:
          // Check if data is stale
          if (ttl > 0 && Date.now() - fetchedAt > ttl) {
            load();
            throw promise;
          }
          return result;
        default:
          throw new Error('Unknown resource status');
      }
    },

    /**
     * Preload the resource without reading (won't trigger Suspense).
     */
    preload() {
      if (status === STATUS.PENDING) return promise;
      if (ttl > 0 && Date.now() - fetchedAt > ttl) {
        return load();
      }
      return Promise.resolve(result);
    },

    /**
     * Force a refresh of the resource data.
     */
    refresh() {
      return load();
    },

    /**
     * Cancel any in-flight request (no-op in simplified version).
     * The abort infrastructure is available in apiClient for future use.
     */
    abort() {
      // no-op — we let fetches complete naturally to avoid
      // StrictMode double-mount timing issues
    },

    /**
     * Get current status without triggering Suspense.
     */
    getStatus() {
      return status;
    },

    /**
     * Peek at the data without triggering Suspense (returns null if not ready).
     */
    peek() {
      return status === STATUS.SUCCESS ? result : null;
    },
  };

  return resource;
}

/**
 * Create a resource that re-fetches when a key changes.
 * Useful for resources that depend on route params or other dynamic values.
 */
function createKeyedResource(fetchFnFactory) {
  const cache = new Map();

  return {
    get(key) {
      const cacheKey = typeof key === 'object' ? JSON.stringify(key) : String(key);

      if (!cache.has(cacheKey)) {
        const resource = createResource(() => fetchFnFactory(key));
        cache.set(cacheKey, resource);
      }

      return cache.get(cacheKey);
    },

    invalidate(key) {
      const cacheKey = typeof key === 'object' ? JSON.stringify(key) : String(key);
      cache.delete(cacheKey);
    },

    invalidateAll() {
      cache.clear();
    },
  };
}

export { createResource, createKeyedResource, STATUS };
