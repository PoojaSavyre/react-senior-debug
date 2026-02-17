/**
 * usePerformanceMetrics - Hook to track and report performance metrics.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

function usePerformanceMetrics(componentName = 'Unknown') {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    avgRenderTime: 0,
    fcp: null,
    lcp: null,
    cls: null,
  });

  const renderCountRef = useRef(0);
  const renderTimesRef = useRef([]);
  const updateTimerRef = useRef(null);

  // Track render count (runs during render, no state update)
  renderCountRef.current++;
  const renderStart = performance.now();

  // Update render metrics on a throttled basis to avoid infinite loops.
  // We track the raw data in refs (no re-render), then flush to state
  // periodically via a timer.
  useEffect(() => {
    const renderTime = performance.now() - renderStart;
    renderTimesRef.current.push(renderTime);

    // Keep only last 50 measurements
    if (renderTimesRef.current.length > 50) {
      renderTimesRef.current.shift();
    }

    // Debounce the state update — only flush once every 1s
    if (!updateTimerRef.current) {
      updateTimerRef.current = setTimeout(() => {
        updateTimerRef.current = null;
        const times = renderTimesRef.current;
        const avgTime = times.length > 0
          ? times.reduce((a, b) => a + b, 0) / times.length
          : 0;
        const lastTime = times.length > 0 ? times[times.length - 1] : 0;

        setMetrics((prev) => ({
          ...prev,
          renderCount: renderCountRef.current,
          lastRenderTime: Math.round(lastTime * 100) / 100,
          avgRenderTime: Math.round(avgTime * 100) / 100,
        }));
      }, 1000);
    }
  });

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, []);

  // Observe Web Vitals
  useEffect(() => {
    const observers = [];

    // FCP
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          setMetrics((prev) => ({
            ...prev,
            fcp: Math.round(entries[0].startTime),
          }));
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      observers.push(fcpObserver);
    } catch (e) {
      // PerformanceObserver may not support this type
    }

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          setMetrics((prev) => ({
            ...prev,
            lcp: Math.round(lastEntry.startTime),
          }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {
      // PerformanceObserver may not support this type
    }

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        setMetrics((prev) => ({
          ...prev,
          cls: Math.round(clsValue * 1000) / 1000,
        }));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch (e) {
      // PerformanceObserver may not support this type
    }

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  // Manual performance mark/measure
  const mark = useCallback(
    (markName) => {
      performance.mark(`${componentName}:${markName}`);
    },
    [componentName]
  );

  const measure = useCallback(
    (measureName, startMark, endMark) => {
      try {
        const prefix = componentName;
        performance.measure(
          `${prefix}:${measureName}`,
          `${prefix}:${startMark}`,
          `${prefix}:${endMark}`
        );
        const entries = performance.getEntriesByName(`${prefix}:${measureName}`);
        return entries.length > 0 ? entries[entries.length - 1].duration : null;
      } catch (e) {
        return null;
      }
    },
    [componentName]
  );

  return { metrics, mark, measure };
}

export { usePerformanceMetrics };
