/**
 * PerformanceOverlay - Dev overlay showing performance metrics, render counts.
 */

import React, { useState, memo, useCallback } from 'react';
import { usePerformanceContext } from '../../context/PerformanceContext';
import { useEventLoopHealth } from '../../hooks/useEventLoopHealth';

const PerformanceOverlay = memo(function PerformanceOverlay() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { metrics: perfMetrics } = usePerformanceContext();
  const eventLoopHealth = useEventLoopHealth({ enabled: isExpanded });

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const containerStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    zIndex: 9999,
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    maxWidth: isExpanded ? '320px' : '44px',
    overflow: 'hidden',
    transition: 'max-width 0.2s ease',
  };

  if (!isExpanded) {
    return (
      <div style={containerStyle}>
        <button
          onClick={toggle}
          style={{
            width: '44px',
            height: '44px',
            border: 'none',
            background: 'transparent',
            color: '#10b981',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Performance Monitor"
        >
          ⚡
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: 'bold', color: '#10b981' }}>⚡ Performance</span>
          <button
            onClick={toggle}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <MetricRow label="Total Renders" value={perfMetrics.totalRenders} />
          <MetricRow label="Slow Renders" value={perfMetrics.slowRenders} warn={perfMetrics.slowRenders > 5} />

          <div style={{ borderTop: '1px solid #374151', margin: '4px 0' }} />

          <MetricRow label="Event Loop Score" value={`${eventLoopHealth.score}/100`} warn={eventLoopHealth.score < 60} />
          <MetricRow label="Current Lag" value={`${eventLoopHealth.currentLag}ms`} warn={eventLoopHealth.currentLag > 50} />
          <MetricRow label="Avg Lag" value={`${eventLoopHealth.avgLag}ms`} />
          <MetricRow label="Lag Spikes" value={eventLoopHealth.lagSpikes} warn={eventLoopHealth.lagSpikes > 10} />

          {perfMetrics.memoryUsage && (
            <>
              <div style={{ borderTop: '1px solid #374151', margin: '4px 0' }} />
              <MetricRow label="JS Heap" value={`${perfMetrics.memoryUsage.usedJSHeapSize}MB`} />
            </>
          )}

          <div style={{ borderTop: '1px solid #374151', margin: '4px 0' }} />
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Components: {Object.keys(perfMetrics.componentRenderCounts).length} tracked
          </div>
        </div>
      </div>
    </div>
  );
});

const MetricRow = memo(function MetricRow({ label, value, warn = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#9ca3af' }}>{label}</span>
      <span style={{ color: warn ? '#ef4444' : '#d1d5db', fontWeight: warn ? 'bold' : 'normal' }}>
        {value}
      </span>
    </div>
  );
});

export { PerformanceOverlay };
