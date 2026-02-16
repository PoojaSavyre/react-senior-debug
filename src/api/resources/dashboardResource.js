/**
 * Dashboard-related Suspense resources.
 *
 * Competency: React Suspense for Data Fetching
 */

import { createResource } from './createResource';
import { get } from '../client';

/**
 * Resource for fetching dashboard widget data.
 */
function createDashboardResource() {
  return createResource(
    (signal) => get('/dashboard', { signal }).then((res) => res.data),
    { cacheKey: 'dashboard', ttl: 15000 }
  );
}

/**
 * Resource for fetching performance metrics.
 */
function createMetricsResource() {
  return createResource(
    (signal) => get('/metrics', { signal }).then((res) => res.data),
    { cacheKey: 'metrics', ttl: 5000 }
  );
}

export { createDashboardResource, createMetricsResource };
