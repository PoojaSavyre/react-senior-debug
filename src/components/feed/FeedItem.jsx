/**
 * FeedItem - Memoized individual feed message.
 */

import React, { memo } from 'react';

const severityColors = {
  low: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  medium: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  high: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  critical: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
};

const typeIcons = {
  alert: '🔔',
  notification: '📢',
  update: '🔄',
  warning: '⚠️',
  info: 'ℹ️',
};

const FeedItem = memo(function FeedItem({ item }) {
  const colors = severityColors[item.severity] || severityColors.low;
  const icon = typeIcons[item.type] || '📌';
  const time = new Date(item.timestamp).toLocaleTimeString();

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid #f3f4f6',
      backgroundColor: colors.bg,
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>
          {item.message}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6b7280' }}>
          <span>{time}</span>
          <span style={{
            padding: '1px 6px',
            borderRadius: '10px',
            backgroundColor: colors.border,
            color: colors.text,
            fontWeight: '500',
          }}>
            {item.severity}
          </span>
          <span>{item.source}</span>
        </div>
      </div>
    </div>
  );
});

export { FeedItem };
