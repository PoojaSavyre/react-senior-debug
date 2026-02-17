/**
 * AnalyticsPage - Lazy loaded route page for analytics + event loop.
 */

import React from 'react';
import { AnalyticsChartWrapper } from '../components/analytics/AnalyticsChart';
import { EventLoopDashboard } from '../components/analytics/EventLoopDashboard';
import { TimerPlayground } from '../components/analytics/TimerPlayground';
import { HeavyComputation } from '../components/analytics/HeavyComputation';

function AnalyticsPage() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Analytics</h2>

      {/* Analytics data via Suspense with refresh/invalidation */}
      <AnalyticsChartWrapper />

      {/* Event Loop Health */}
      <EventLoopDashboard />

      {/* Timer Playground */}
      <TimerPlayground />

      {/* Heavy Computation Demo */}
      <HeavyComputation />
    </div>
  );
}

export default AnalyticsPage;
