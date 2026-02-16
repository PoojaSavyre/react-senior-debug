/**
 * Cache invalidation utilities - tag-based and mutation-triggered invalidation.
 *
 * Competency: API Response Caching
 */

class CacheInvalidator {
  constructor(cacheManager) {
    this.cache = cacheManager;
    this.mutationRules = new Map();
  }

  /**
   * Register a rule: when a mutation happens on a resource,
   * invalidate all cache entries with the specified tags.
   */
  registerMutationRule(resourceType, mutationType, tags) {
    const key = `${resourceType}:${mutationType}`;
    this.mutationRules.set(key, tags);
  }

  /**
   * Trigger invalidation after a mutation occurs.
   */
  onMutation(resourceType, mutationType, payload = {}) {
    const key = `${resourceType}:${mutationType}`;
    const tags = this.mutationRules.get(key);

    if (tags) {
      let invalidated = 0;
      tags.forEach((tag) => {
        const tagToInvalidate = typeof tag === 'function' ? tag(payload) : tag;
        invalidated += this.cache.invalidateByTag(tagToInvalidate);
      });
      return invalidated;
    }

    return 0;
  }

  /**
   * Invalidate all cache entries related to a specific entity.
   */
  invalidateEntity(entityType, entityId) {
    const tag = `${entityType}:${entityId}`;
    return this.cache.invalidateByTag(tag);
  }

  /**
   * Invalidate all cache entries for a collection.
   */
  invalidateCollection(collectionName) {
    return this.cache.invalidateByTag(`collection:${collectionName}`);
  }
}

export { CacheInvalidator };
