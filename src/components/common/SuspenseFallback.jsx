/**
 * SuspenseFallback - Accessible loading fallback UIs that prevent layout shifts.
 */

import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    minHeight: '100px',
  },
  page: {
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  skeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  text: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
};

function SuspenseFallback({ level = 'section', message = 'Loading...' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message}
      style={level === 'page' ? styles.page : styles.container}
    >
      <div style={styles.spinner} />
      <p style={styles.text}>{message}</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function SkeletonCard({ width = '100%', height = '120px' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      style={{
        ...styles.skeleton,
        width,
        height,
      }}
    />
  );
}

function SkeletonList({ count = 5, itemHeight = '60px' }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            ...styles.skeleton,
            width: '100%',
            height: itemHeight,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', padding: '20px' }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCard key={i} height="140px" />
      ))}
    </div>
  );
}

export { SuspenseFallback, SkeletonCard, SkeletonList, SkeletonDashboard };
