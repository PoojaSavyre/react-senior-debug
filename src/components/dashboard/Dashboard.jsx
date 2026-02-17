/**
 * Dashboard - Main dashboard component with memoized widgets and performance tracking.
 */

import React, { memo, useMemo, useCallback, useState, startTransition } from 'react';
import { DashboardWidget } from './DashboardWidget';
import { MetricsPanel } from './MetricsPanel';
import { RealTimeIndicator } from './RealTimeIndicator';
import { DataGrid } from './DataGrid';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';
import { usePerformanceContext } from '../../context/PerformanceContext';
import { useApiCache } from '../../hooks/useApiCache';
import { get } from '../../api/client';

const Dashboard = memo(function Dashboard() {
  const { metrics, mark, measure } = usePerformanceMetrics('Dashboard');
  const { trackRender } = usePerformanceContext();
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [gridFilter, setGridFilter] = useState('');

  // Track this render in the global performance context
  React.useEffect(() => {
    trackRender('Dashboard', metrics.lastRenderTime);
  }, [metrics.lastRenderTime, trackRender]);

  // Fetch dashboard data with caching (stale-while-revalidate strategy)
  const { data: dashboardData, isLoading, refetch } = useApiCache(
    () => get('/dashboard'),
    { cacheKey: 'dashboard-widgets', strategy: 'stale-while-revalidate', ttl: 15000, tags: ['dashboard'] }
  );

  // Memoize widget click handler to prevent child re-renders
  const handleWidgetClick = useCallback((widgetId) => {
    mark('widget-click-start');
    setSelectedWidget(widgetId);
    mark('widget-click-end');
    measure('widget-click', 'widget-click-start', 'widget-click-end');
  }, [mark, measure]);

  // Memoize the filter handler with startTransition for non-urgent updates
  const handleFilterChange = useCallback((e) => {
    startTransition(() => {
      setGridFilter(e.target.value);
    });
  }, []);

  // Memoize widgets to prevent recalculation
  const widgets = useMemo(() => {
    return dashboardData?.data?.widgets || [];
  }, [dashboardData]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <RealTimeIndicator />
          <button
            onClick={refetch}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {widgets.map((widget) => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            isSelected={selectedWidget === widget.id}
            onClick={handleWidgetClick}
          />
        ))}
        {isLoading && widgets.length === 0 && (
          Array.from({ length: 6 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              style={{
                height: '140px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))
        )}
      </div>

      {/* Performance Metrics Panel */}
      <MetricsPanel renderMetrics={metrics} />

      {/* Data Grid with filter */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Filter data..."
            value={gridFilter}
            onChange={handleFilterChange}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '250px',
            }}
          />
        </div>
        <DataGrid filter={gridFilter} />
      </div>
    </div>
  );
});

export { Dashboard };
