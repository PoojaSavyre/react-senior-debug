/**
 * PerformanceContext - Provides performance monitoring to the component tree.
 *
 * Competency: React Performance Analysis
 * Bug surface: untracked metrics, performance context overhead
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useRef } from 'react';
import { useInterval } from '../hooks/useInterval';

const PerformanceContext = createContext(null);

function PerformanceProvider({ children, trackingEnabled = true }) {
  const [globalMetrics, setGlobalMetrics] = useState({
    componentRenderCounts: {},
    totalRenders: 0,
    slowRenders: 0,
    memoryUsage: null,
  });

  const renderLogRef = useRef([]);

  const trackRender = useCallback((componentName, renderTime) => {
    renderLogRef.current.push({
      component: componentName,
      time: renderTime,
      timestamp: Date.now(),
    });

    // Keep bounded
    if (renderLogRef.current.length > 500) {
      renderLogRef.current = renderLogRef.current.slice(-500);
    }

    setGlobalMetrics((prev) => ({
      ...prev,
      totalRenders: prev.totalRenders + 1,
      slowRenders: renderTime > 16 ? prev.slowRenders + 1 : prev.slowRenders,
      componentRenderCounts: {
        ...prev.componentRenderCounts,
        [componentName]: (prev.componentRenderCounts[componentName] || 0) + 1,
      },
    }));
  }, []);

  // Periodically check memory usage
  useInterval(() => {
    if (trackingEnabled && performance.memory) {
      setGlobalMetrics((prev) => ({
        ...prev,
        memoryUsage: {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
        },
      }));
    }
  }, trackingEnabled ? 5000 : null);

  const getRenderLog = useCallback((componentName, limit = 20) => {
    const log = renderLogRef.current;
    if (componentName) {
      return log.filter((e) => e.component === componentName).slice(-limit);
    }
    return log.slice(-limit);
  }, []);

  const resetMetrics = useCallback(() => {
    renderLogRef.current = [];
    setGlobalMetrics({
      componentRenderCounts: {},
      totalRenders: 0,
      slowRenders: 0,
      memoryUsage: null,
    });
  }, []);

  const value = useMemo(
    () => ({
      metrics: globalMetrics,
      trackRender,
      getRenderLog,
      resetMetrics,
      trackingEnabled,
    }),
    [globalMetrics, trackRender, getRenderLog, resetMetrics, trackingEnabled]
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}

export { PerformanceProvider, usePerformanceContext, PerformanceContext };
