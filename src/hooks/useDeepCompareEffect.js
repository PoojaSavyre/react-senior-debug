/**
 * useDeepCompareEffect - Effect hook that uses deep comparison for dependencies.
 *
 * Competency: React Hook Dependencies
 * Bug surface: object reference dependencies, primitive vs reference,
 *              hook dependency referential inequality, useMemo stale dependencies
 */

import { useEffect, useRef } from 'react';

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

function useDeepCompareMemoize(value) {
  const ref = useRef(value);

  if (!deepEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

/**
 * Like useEffect, but uses deep comparison on the dependency array.
 * Useful when dependencies are objects/arrays that are recreated each render
 * but contain the same values.
 */
function useDeepCompareEffect(effect, dependencies) {
  const memoizedDeps = useDeepCompareMemoize(dependencies);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [memoizedDeps]);
}

/**
 * Deep compare callback - returns a stable callback when deep-equal deps haven't changed.
 */
function useDeepCompareCallback(callback, dependencies) {
  const memoizedDeps = useDeepCompareMemoize(dependencies);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedDeps]);

  return callbackRef.current;
}

export { useDeepCompareEffect, useDeepCompareCallback, deepEqual };
