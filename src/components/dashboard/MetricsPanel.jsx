/**
 * MetricsPanel - Displays performance metrics (FCP, LCP, CLS, render stats).
 */

import React, { memo } from 'react';

const MetricsPanel = memo(function MetricsPanel({ renderMetrics }) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#374151' }}>
        Component Performance
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
        <MetricCard
          label="Render Count"
          value={renderMetrics.renderCount}
          unit="renders"
        />
        <MetricCard
          label="Last Render"
          value={renderMetrics.lastRenderTime}
          unit="ms"
          warn={renderMetrics.lastRenderTime > 16}
        />
        <MetricCard
          label="Avg Render"
          value={renderMetrics.avgRenderTime}
          unit="ms"
          warn={renderMetrics.avgRenderTime > 16}
        />
        {renderMetrics.fcp !== null && (
          <MetricCard
            label="FCP"
            value={renderMetrics.fcp}
            unit="ms"
            warn={renderMetrics.fcp > 2500}
          />
        )}
        {renderMetrics.lcp !== null && (
          <MetricCard
            label="LCP"
            value={renderMetrics.lcp}
            unit="ms"
            warn={renderMetrics.lcp > 4000}
          />
        )}
        {renderMetrics.cls !== null && (
          <MetricCard
            label="CLS"
            value={renderMetrics.cls}
            unit=""
            warn={renderMetrics.cls > 0.1}
          />
        )}
      </div>
    </div>
  );
});

const MetricCard = memo(function MetricCard({ label, value, unit, warn = false }) {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: `1px solid ${warn ? '#fecaca' : '#e5e7eb'}`,
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: warn ? '#dc2626' : '#111827' }}>
        {value}
        <span style={{ fontSize: '11px', fontWeight: '400', color: '#9ca3af', marginLeft: '2px' }}>
          {unit}
        </span>
      </div>
    </div>
  );
});

export { MetricsPanel };
