/**
 * User-related Suspense resources.
 *
 * Competency: React Suspense for Data Fetching
 */

import { createResource, createKeyedResource } from './createResource';
import { get } from '../client';

/**
 * Resource for fetching the paginated user list.
 */
function createUserListResource(params = {}) {
  const { page = 1, limit = 10, search = '' } = params;
  const query = new URLSearchParams({ page, limit, search }).toString();

  return createResource(
    (signal) => get(`/users?${query}`, { signal }).then((res) => res.data),
    { cacheKey: `users-list-${query}` }
  );
}

/**
 * Keyed resource for individual user profiles.
 * Re-fetches when the user ID changes.
 */
const userProfileResource = createKeyedResource(
  (userId) => get(`/users/${userId}`).then((res) => res.data)
);

export { createUserListResource, userProfileResource };
