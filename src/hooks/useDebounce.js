/**
 * useDebounce - Debounce hook with stable callback references.
 *
 * Competency: React Hook Dependencies
 * Bug surface: stale closure in callback, hook dependency referential inequality,
 *              effect cleanup dependencies, missing cleanup
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounce a value - returns the debounced version of the value.
 */
function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function - returns a stable debounced version.
 * The callback ref pattern prevents stale closure issues.
 */
function useDebouncedCallback(callback, delay = 300) {
  // Store the latest callback in a ref to avoid stale closures
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Store the timer in a ref for cleanup
  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Return a stable debounced function
  const debouncedFn = useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timerRef.current = null;
      }, delay);
    },
    [delay]
  );

  // Cancel function
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Flush function - execute immediately
  const flush = useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      callbackRef.current(...args);
    },
    []
  );

  return { debouncedFn, cancel, flush };
}

export { useDebouncedValue, useDebouncedCallback };
