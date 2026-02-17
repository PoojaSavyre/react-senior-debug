/**
 * useThrottle - Throttle hook using requestAnimationFrame and timers.
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Throttle a callback to execute at most once per interval.
 */
function useThrottle(callback, interval = 100) {
  const callbackRef = useRef(callback);
  const lastCallRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const throttledFn = useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= interval) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule trailing call
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callbackRef.current(...args);
          timerRef.current = null;
        }, interval - timeSinceLastCall);
      }
    },
    [interval]
  );

  return throttledFn;
}

/**
 * Throttle to animation frame rate (~16ms).
 */
function useRAFThrottle(callback) {
  const callbackRef = useRef(callback);
  const rafIdRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const throttledFn = useCallback((...args) => {
    if (rafIdRef.current) return;

    rafIdRef.current = requestAnimationFrame(() => {
      callbackRef.current(...args);
      rafIdRef.current = null;
    });
  }, []);

  return throttledFn;
}

export { useThrottle, useRAFThrottle };
