/**
 * CacheManager - LRU cache with TTL, tag-based invalidation, and size limits.
 */

class CacheEntry {
  constructor(key, value, options = {}) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.lastAccessedAt = Date.now();
    this.accessCount = 0;
    this.ttl = options.ttl || 60000;
    this.tags = options.tags || [];
    this.etag = options.etag || null;
  }

  isExpired() {
    return Date.now() - this.createdAt > this.ttl;
  }

  access() {
    this.lastAccessedAt = Date.now();
    this.accessCount++;
    return this.value;
  }
}

class CacheManager {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 100;
    this.defaultTTL = options.defaultTTL || 60000;
    this.cache = new Map();
    this.tagIndex = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0,
    };
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this._remove(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    // Move to end for LRU (Map maintains insertion order)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.access();
  }

  set(key, value, options = {}) {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this._remove(key);
    }

    // Evict LRU if at capacity
    while (this.cache.size >= this.maxEntries) {
      this._evictLRU();
    }

    const entry = new CacheEntry(key, value, {
      ttl: options.ttl || this.defaultTTL,
      tags: options.tags || [],
      etag: options.etag || null,
    });

    this.cache.set(key, entry);

    // Update tag index
    entry.tags.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(key);
    });

    return entry;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.isExpired()) {
      this._remove(key);
      return false;
    }
    return true;
  }

  invalidate(key) {
    this._remove(key);
    this.stats.invalidations++;
  }

  invalidateByTag(tag) {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    keys.forEach((key) => {
      this._remove(key);
      count++;
    });

    this.tagIndex.delete(tag);
    this.stats.invalidations += count;
    return count;
  }

  invalidateByPattern(pattern) {
    const regex = new RegExp(pattern);
    let count = 0;

    const keysToRemove = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => {
      this._remove(key);
      count++;
    });

    this.stats.invalidations += count;
    return count;
  }

  getStale(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return entry.value;
  }

  getEtag(key) {
    const entry = this.cache.get(key);
    return entry?.etag || null;
  }

  clear() {
    this.cache.clear();
    this.tagIndex.clear();
  }

  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
        : '0.0';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxEntries,
    };
  }

  _remove(key) {
    const entry = this.cache.get(key);
    if (!entry) return;

    // Clean up tag index
    entry.tags.forEach((tag) => {
      const tagKeys = this.tagIndex.get(tag);
      if (tagKeys) {
        tagKeys.delete(key);
        if (tagKeys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    this.cache.delete(key);
  }

  _evictLRU() {
    // Map iterator gives keys in insertion order; first key is the LRU
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this._remove(firstKey);
      this.stats.evictions++;
    }
  }
}

export { CacheManager, CacheEntry };
