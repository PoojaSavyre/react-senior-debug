/**
 * useInterval - Safe interval hook with proper cleanup and no stale closures.
 */

import { useEffect, useRef } from 'react';

/**
 * Dan Abramov's useInterval pattern.
 * The callback is stored in a ref so the interval always calls
 * the latest version without needing to restart the interval.
 */
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  // Remember the latest callback without restarting the interval
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null || delay === undefined) {
      return; // Paused
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}

export { useInterval };
