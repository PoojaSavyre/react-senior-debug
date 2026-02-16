/**
 * Analytics-related Suspense resources.
 *
 * Competency: React Suspense for Data Fetching
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
