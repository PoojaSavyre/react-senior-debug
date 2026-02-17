/**
 * useEventLoopHealth - React hook that monitors event loop health.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { EventLoopMonitor } from '../services/eventLoop/EventLoopMonitor';

function useEventLoopHealth(options = {}) {
  const { sampleInterval = 200, enabled = true } = options;

  const [health, setHealth] = useState({
    score: 100,
    currentLag: 0,
    avgLag: 0,
    maxLag: 0,
    lagSpikes: 0,
    stalls: 0,
    isHealthy: true,
  });

  const monitorRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const monitor = new EventLoopMonitor({ sampleInterval });
    monitorRef.current = monitor;

    // Subscribe to samples
    const unsubSample = monitor.onSample(() => {
      const stats = monitor.getStats();
      const score = monitor.getHealthScore();

      setHealth({
        score,
        currentLag: stats.currentLag,
        avgLag: stats.avgLag,
        maxLag: stats.maxLag,
        lagSpikes: stats.lagSpikes,
        stalls: stats.stalls,
        isHealthy: score > 60,
      });
    });

    monitor.start();

    return () => {
      unsubSample();
      monitor.destroy();
      monitorRef.current = null;
    };
  }, [sampleInterval, enabled]);

  const reset = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.reset();
      setHealth({
        score: 100,
        currentLag: 0,
        avgLag: 0,
        maxLag: 0,
        lagSpikes: 0,
        stalls: 0,
        isHealthy: true,
      });
    }
  }, []);

  const getSamples = useCallback((count = 50) => {
    if (monitorRef.current) {
      return monitorRef.current.getSamples(count);
    }
    return [];
  }, []);

  return { ...health, reset, getSamples };
}

export { useEventLoopHealth };
