/**
 * Analytics-related Suspense resources.
 */

import { createResource } from './createResource';
import { get } from '../client';

/**
 * Resource for fetching analytics data. Intentionally slow (~2s) to test Suspense.
 */
function createAnalyticsResource() {
  return createResource(
    (signal) => get('/analytics', { signal }).then((res) => res.data),
    { cacheKey: 'analytics', ttl: 30000 }
  );
}

export { createAnalyticsResource };
