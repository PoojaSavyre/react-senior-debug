/**
 * AnalyticsChart - Renders analytics time-series data with Suspense.
 * Subscribes to real-time WebSocket updates for live metric refreshes.
 */

import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { get } from '../../api/client';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { SuspenseBoundary } from '../common/SuspenseBoundary';
import { SkeletonDashboard } from '../common/SuspenseFallback';

// ── Module-level Suspense cache ──
// Uses apiClient (retry, dedup, rate limiting) inside the throw-promise pattern
let analyticsEntry = null;

function readAnalytics() {
  if (analyticsEntry && analyticsEntry.data) return analyticsEntry.data;
  if (analyticsEntry && analyticsEntry.error) throw analyticsEntry.error; // ErrorBoundary catches once
  if (analyticsEntry && analyticsEntry.promise) throw analyticsEntry.promise;

  analyticsEntry = { data: null, error: null, promise: null };
  analyticsEntry.promise = get('/analytics')
    .then((d) => { analyticsEntry.data = d; })
    .catch((e) => { analyticsEntry.error = e; }); // Store error, don't reset cache
  throw analyticsEntry.promise;
}

// Invalidate the Suspense cache (forces re-fetch on next read)
function invalidateAnalyticsCache() {
  analyticsEntry = null;
}

/**
 * AnalyticsChartWrapper - Provides refresh capability around the Suspense boundary
 * and subscribes to real-time WebSocket analytics updates.
 */
const AnalyticsChartWrapper = memo(function AnalyticsChartWrapper() {
  const { subscribe, send, connected, authenticated } = useWebSocketContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [realtimeUpdate, setRealtimeUpdate] = useState(null);

  // Subscribe to the 'analytics' WebSocket channel when authenticated
  useEffect(() => {
    if (connected && authenticated) {
      send('subscribe', { channel: 'analytics' });
    }
    return () => {
      if (connected && authenticated) {
        send('unsubscribe', { channel: 'analytics' });
      }
    };
  }, [connected, authenticated, send]);

  // Listen for real-time analytics:update messages
  useEffect(() => {
    const unsubscribe = subscribe('analytics:update', (payload) => {
      setRealtimeUpdate(payload);
    });
    return unsubscribe;
  }, [subscribe]);

  const handleRefresh = useCallback(() => {
    invalidateAnalyticsCache();
    setRealtimeUpdate(null);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Analytics Overview</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {realtimeUpdate && (
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>
              Live
            </span>
          )}
          <button onClick={handleRefresh} style={{
            padding: '6px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#374151',
          }}>
            Refresh Data
          </button>
        </div>
      </div>
      <SuspenseBoundary
        suspenseKey={`analytics-${refreshKey}`}
        fallback={<SkeletonDashboard />}
        level="section"
      >
        <AnalyticsChart realtimeUpdate={realtimeUpdate} />
      </SuspenseBoundary>
    </div>
  );
});

const AnalyticsChart = memo(function AnalyticsChart({ realtimeUpdate }) {
  const response = readAnalytics();
  const { summary: initialSummary, timeSeries: initialTimeSeries } = response.data;

  // Merge real-time WebSocket data into the summary when available
  const summary = useMemo(() => {
    if (!realtimeUpdate) return initialSummary;
    return {
      ...initialSummary,
      activeToday: realtimeUpdate.activeUsers,
      totalRequests: realtimeUpdate.requests,
      avgResponseTime: realtimeUpdate.avgLatency,
      errorRate: realtimeUpdate.errorRate,
    };
  }, [initialSummary, realtimeUpdate]);

  // Append the latest real-time data point to the time series
  const timeSeries = useMemo(() => {
    if (!realtimeUpdate || !initialTimeSeries) return initialTimeSeries;
    const livePoint = {
      timestamp: realtimeUpdate.timestamp,
      activeUsers: realtimeUpdate.activeUsers,
      requests: realtimeUpdate.requests,
      errorRate: realtimeUpdate.errorRate,
      avgLatency: realtimeUpdate.avgLatency,
    };
    const updated = [...initialTimeSeries.slice(1), livePoint];
    return updated;
  }, [initialTimeSeries, realtimeUpdate]);

  // Memoize computed chart data
  const chartBars = useMemo(() => {
    if (!timeSeries) return [];
    const maxRequests = Math.max(...timeSeries.map((d) => d.requests));
    return timeSeries.map((point) => ({
      ...point,
      heightPercent: maxRequests > 0 ? (point.requests / maxRequests) * 100 : 0,
      hour: new Date(point.timestamp).getHours(),
    }));
  }, [timeSeries]);

  return (
    <div>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <SummaryCard label="Total Users" value={summary.totalUsers.toLocaleString()} />
        <SummaryCard label="Active Today" value={summary.activeToday.toLocaleString()} />
        <SummaryCard label="Total Requests" value={summary.totalRequests.toLocaleString()} />
        <SummaryCard label="Avg Response" value={`${summary.avgResponseTime}ms`} />
        <SummaryCard label="Uptime" value={`${summary.uptime}%`} />
        <SummaryCard label="Error Rate" value={`${summary.errorRate}%`} />
      </div>

      {/* Simple Bar Chart */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#374151' }}>
          Requests (24h)
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '3px',
          height: '150px',
          padding: '0 10px',
        }}>
          {chartBars.map((bar, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${bar.heightPercent}%`,
                backgroundColor: '#3b82f6',
                borderRadius: '2px 2px 0 0',
                minHeight: '2px',
                transition: 'height 0.2s ease',
                position: 'relative',
              }}
              title={`${bar.hour}:00 - ${bar.requests.toLocaleString()} requests`}
            />
          ))}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '10px',
          color: '#9ca3af',
          padding: '0 10px',
        }}>
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>
      </div>
    </div>
  );
});

const SummaryCard = memo(function SummaryCard({ label, value }) {
  return (
    <div style={{
      padding: '14px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>{value}</div>
    </div>
  );
});

export { AnalyticsChart, AnalyticsChartWrapper, invalidateAnalyticsCache };
