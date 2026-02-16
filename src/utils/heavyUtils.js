/**
 * Heavy utility module — loaded via dynamic import() for code splitting.
 *
 * Competency: Bundle Optimization Strategies
 * Bug surface: incorrect code splitting, missing lazy loading, oversized vendor bundles,
 *              tree shaking failures (unused exports should be stripped)
 */

/**
 * Compute a simple checksum for the given data string.
 * This simulates a "heavy" utility that shouldn't be in the main bundle.
 */
export function computeChecksum(data) {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `CHK-${Math.abs(hash).toString(16).toUpperCase()}`;
}

/**
 * Deep clone an object using structured clone algorithm.
 */
export function deepClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function with leading/trailing options.
 */
export function debounce(fn, delay, options = {}) {
  const { leading = false, trailing = true } = options;
  let timer = null;
  let lastArgs = null;

  const debounced = (...args) => {
    lastArgs = args;

    if (leading && !timer) {
      fn(...args);
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      if (trailing && lastArgs) {
        fn(...lastArgs);
      }
      timer = null;
      lastArgs = null;
    }, delay);
  };

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  return debounced;
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Generate a UUID v4.
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * This function is intentionally never imported by any component.
 * Tree shaking should remove it from the production bundle.
 * Bug surface: if tree shaking fails, this 10KB string stays in the bundle.
 */
export function unusedHeavyFunction() {
  const payload = 'x'.repeat(10000);
  return payload.split('').reverse().join('');
}
