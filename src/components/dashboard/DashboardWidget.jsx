/**
 * DashboardWidget - Memoized widget component with custom comparator.
 *
 * Competency: React Performance Analysis
 * Bug surface: incorrect use of React.memo, stale props
 */

import React, { memo } from 'react';

const DashboardWidget = memo(
  function DashboardWidget({ widget, isSelected, onClick }) {
    const change = parseFloat(widget.change);
    const isPositive = change > 0;
    const isNeutral = change === 0;

    return (
      <div
        onClick={() => onClick(widget.id)}
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: isSelected ? '#eff6ff' : 'white',
          border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isSelected
            ? '0 0 0 2px rgba(59, 130, 246, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          {widget.title}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          {widget.value}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <span style={{
            color: isNeutral ? '#6b7280' : isPositive ? '#059669' : '#dc2626',
            fontWeight: '500',
          }}>
            {isPositive ? '↑' : isNeutral ? '→' : '↓'} {Math.abs(change)}%
          </span>
          <span style={{ color: '#9ca3af' }}>{widget.period}</span>
        </div>
      </div>
    );
  },
  // Custom comparator: only re-render when these specific props change
  (prevProps, nextProps) => {
    return (
      prevProps.widget.id === nextProps.widget.id &&
      prevProps.widget.value === nextProps.widget.value &&
      prevProps.widget.change === nextProps.widget.change &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);

export { DashboardWidget };
