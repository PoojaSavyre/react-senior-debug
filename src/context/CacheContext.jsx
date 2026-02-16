/**
 * CacheContext - Provides cache manager to the component tree.
 *
 * Competency: API Response Caching
 * Bug surface: incorrect context API implementation, stale context values
 */

import React, { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { CacheManager } from '../services/cache/CacheManager';
import { CacheInvalidator } from '../services/cache/invalidation';

const CacheContext = createContext(null);

function CacheProvider({ children, options = {} }) {
  const [, forceUpdate] = useState(0);

  const cache = useMemo(
    () => new CacheManager(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const invalidator = useMemo(() => {
    const inv = new CacheInvalidator(cache);

    // Register common mutation rules
    inv.registerMutationRule('users', 'create', ['collection:users']);
    inv.registerMutationRule('users', 'update', [
      'collection:users',
      (payload) => `user:${payload.id}`,
    ]);
    inv.registerMutationRule('users', 'delete', [
      'collection:users',
      (payload) => `user:${payload.id}`,
    ]);

    return inv;
  }, [cache]);

  const invalidateAndRefresh = useCallback(
    (resourceType, mutationType, payload) => {
      invalidator.onMutation(resourceType, mutationType, payload);
      forceUpdate((n) => n + 1);
    },
    [invalidator]
  );

  const value = useMemo(
    () => ({
      cache,
      invalidator,
      invalidateAndRefresh,
      getStats: () => cache.getStats(),
    }),
    [cache, invalidator, invalidateAndRefresh]
  );

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

function useCacheContext() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext must be used within a CacheProvider');
  }
  return context;
}

export { CacheProvider, useCacheContext, CacheContext };
