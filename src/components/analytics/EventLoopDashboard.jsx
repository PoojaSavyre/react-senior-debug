/**
 * EventLoopDashboard - Visualizes event loop health and phase timings.
 */

import React, { useState, useCallback, memo } from 'react';
import { useEventLoopHealth } from '../../hooks/useEventLoopHealth';
import { EventLoopProfiler } from '../../services/eventLoop/profiler';

const profiler = new EventLoopProfiler();

const EventLoopDashboard = memo(function EventLoopDashboard() {
  const health = useEventLoopHealth({ enabled: true, sampleInterval: 200 });
  const [phaseResults, setPhaseResults] = useState(null);
  const [blockingResults, setBlockingResults] = useState(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  const measurePhases = useCallback(async () => {
    setIsMeasuring(true);
    try {
      const results = await profiler.measurePhases();
      setPhaseResults(results);
    } catch (err) {
      console.error('Phase measurement failed:', err);
    }
    setIsMeasuring(false);
  }, []);

  const measureBlocking = useCallback(async () => {
    setIsMeasuring(true);
    try {
      const results = await profiler.measureBlockingImpact(100);
      setBlockingResults(results);
    } catch (err) {
      console.error('Blocking measurement failed:', err);
    }
    setIsMeasuring(false);
  }, []);

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>
        Event Loop Health
      </h3>

      {/* Health Score */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <HealthMetric
          label="Score"
          value={`${health.score}/100`}
          color={getHealthColor(health.score)}
        />
        <HealthMetric
          label="Current Lag"
          value={`${health.currentLag}ms`}
          color={health.currentLag > 50 ? '#ef4444' : '#10b981'}
        />
        <HealthMetric
          label="Avg Lag"
          value={`${health.avgLag}ms`}
          color={health.avgLag > 16 ? '#f59e0b' : '#10b981'}
        />
        <HealthMetric
          label="Max Lag"
          value={`${health.maxLag}ms`}
          color={health.maxLag > 100 ? '#ef4444' : '#10b981'}
        />
        <HealthMetric label="Lag Spikes" value={health.lagSpikes} color="#6b7280" />
        <HealthMetric label="Stalls" value={health.stalls} color={health.stalls > 0 ? '#ef4444' : '#6b7280'} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={measurePhases} disabled={isMeasuring} style={actionBtnStyle}>
          Measure Phases
        </button>
        <button onClick={measureBlocking} disabled={isMeasuring} style={actionBtnStyle}>
          Test Blocking Impact
        </button>
        <button onClick={health.reset} style={actionBtnStyle}>
          Reset Stats
        </button>
      </div>

      {/* Phase Results */}
      {phaseResults && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
            Event Loop Phase Order (total: {phaseResults.totalDuration?.toFixed(1)}ms)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {phaseResults.phases.map((phase, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 10px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                fontSize: '13px',
              }}>
                <span>
                  <strong style={{ color: '#374151' }}>{i + 1}.</strong>{' '}
                  <span style={{ color: '#6b7280' }}>{phase.mechanism}</span>
                </span>
                <span style={{ color: '#3b82f6', fontFamily: 'monospace' }}>
                  {phase.time.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocking Results */}
      {blockingResults && (
        <div>
          <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
            Blocking Impact (blocked for {blockingResults.actualBlockTime?.toFixed(1)}ms)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <BlockingMetric
              label="setTimeout delay"
              value={`${blockingResults.timeoutDelay?.toFixed(1) || '?'}ms`}
            />
            <BlockingMetric
              label="rAF delay"
              value={`${blockingResults.rAFDelay?.toFixed(1) || '?'}ms`}
            />
            <BlockingMetric
              label="Microtask delay"
              value={`${blockingResults.microtaskDelay?.toFixed(1) || '?'}ms`}
            />
          </div>
        </div>
      )}
    </div>
  );
});

const HealthMetric = memo(function HealthMetric({ label, value, color }) {
  return (
    <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: '600', color }}>{value}</div>
    </div>
  );
});

const BlockingMetric = memo(function BlockingMetric({ label, value }) {
  return (
    <div style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '4px', textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#991b1b' }}>{label}</div>
    </div>
  );
});

const actionBtnStyle = {
  padding: '6px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
};

export { EventLoopDashboard };
