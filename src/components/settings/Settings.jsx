/**
 * Settings - System settings, cache controls, hook dependency demos, bundle info.
 *
 * Competency: Bundle Optimization Strategies, React Suspense Implementation,
 *             React Hook Dependencies, API Response Caching
 * Bug surface: dynamic import errors, lazy loading failures, bundle chunking,
 *              hook dependency bugs, stale closures, cache invalidation
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { useApiCache, globalCache } from '../../hooks/useApiCache';
import { get } from '../../api/client';

const Settings = memo(function Settings() {
  const [activeTab, setActiveTab] = useState('cache');

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#111827' }}>Settings</h2>

      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        {['cache', 'hooks', 'websocket', 'performance', 'bundle'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: activeTab === tab ? '500' : '400',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'cache' && <CacheSettings />}
      {activeTab === 'hooks' && <HookDependencyLab />}
      {activeTab === 'websocket' && <WebSocketSettings />}
      {activeTab === 'performance' && <PerformanceSettings />}
      {activeTab === 'bundle' && <BundleInfo />}
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Competency 6: API Response Caching — Live cache controls
// ──────────────────────────────────────────────────────────
function CacheSettings() {
  const [stats, setStats] = useState(globalCache.getStats());
  const [invalidateKey, setInvalidateKey] = useState('');
  const [invalidateTag, setInvalidateTag] = useState('');

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(globalCache.getStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInvalidateByKey = useCallback(() => {
    if (invalidateKey.trim()) {
      globalCache.invalidate(invalidateKey.trim());
      setInvalidateKey('');
      setStats(globalCache.getStats());
    }
  }, [invalidateKey]);

  const handleInvalidateByTag = useCallback(() => {
    if (invalidateTag.trim()) {
      globalCache.invalidateByTag(invalidateTag.trim());
      setInvalidateTag('');
      setStats(globalCache.getStats());
    }
  }, [invalidateTag]);

  const handleClearAll = useCallback(() => {
    globalCache.clear();
    setStats(globalCache.getStats());
  }, []);

  return (
    <div style={{ maxWidth: '700px' }}>
      <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>Cache Statistics (Live)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <InfoCard label="Hit Rate" value={stats.hitRate} />
        <InfoCard label="Cache Size" value={`${stats.size}/${stats.maxSize}`} />
        <InfoCard label="Hits" value={stats.hits} />
        <InfoCard label="Misses" value={stats.misses} />
        <InfoCard label="Evictions" value={stats.evictions} />
        <InfoCard label="Invalidations" value={stats.invalidations} />
      </div>

      {/* Cache Invalidation Controls */}
      <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
        Cache Invalidation Controls
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={invalidateKey}
            onChange={(e) => setInvalidateKey(e.target.value)}
            placeholder="Cache key (e.g. dashboard-widgets)"
            style={inputStyle}
          />
          <button onClick={handleInvalidateByKey} style={actionBtnStyle}>
            Invalidate Key
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={invalidateTag}
            onChange={(e) => setInvalidateTag(e.target.value)}
            placeholder="Cache tag (e.g. dashboard)"
            style={inputStyle}
          />
          <button onClick={handleInvalidateByTag} style={actionBtnStyle}>
            Invalidate Tag
          </button>
        </div>
        <button onClick={handleClearAll} style={{ ...actionBtnStyle, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', width: 'fit-content' }}>
          Clear All Cache
        </button>
      </div>

      {/* Strategy Explanation */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        border: '1px solid #bae6fd',
        fontSize: '13px',
        color: '#0369a1',
      }}>
        <strong>Active Strategies:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
          <li><strong>Dashboard</strong>: stale-while-revalidate (TTL 15s, tag: dashboard)</li>
          <li><strong>DataGrid</strong>: cache-first (TTL 30s)</li>
          <li><strong>Analytics/Users</strong>: module-level Suspense cache (via apiClient)</li>
        </ul>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Competency 4: React Hook Dependencies — Interactive demos
// ──────────────────────────────────────────────────────────
function HookDependencyLab() {
  return (
    <div style={{ maxWidth: '700px' }}>
      <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>
        Hook Dependency Lab
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
        Interactive demos showing correct hook dependency patterns. Each demo has specific
        breakpoints where bugs can be introduced.
      </p>

      <StaleClosureDemo />
      <MemoDepDemo />
      <EffectDepDemo />
      <CallbackDepDemo />
    </div>
  );
}

/**
 * Demo 1: Stale closure in event handlers.
 * Bug: if useCallback deps are empty, `count` captured at mount time never updates.
 * Fix: include `count` in deps, or use a ref.
 */
function StaleClosureDemo() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;

  // CORRECT: uses ref to always read latest value
  const handleAlertCorrect = useCallback(() => {
    setTimeout(() => {
      alert(`Count (via ref, always fresh): ${countRef.current}`);
    }, 1000);
  }, []);

  // CORRECT: includes count in deps so closure updates
  const handleAlertWithDep = useCallback(() => {
    setTimeout(() => {
      alert(`Count (via deps): ${count}`);
    }, 1000);
  }, [count]);

  return (
    <DemoSection title="Stale Closure in Event Handlers" breakpoint="Remove countRef usage or empty the deps array to create stale closure bug">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setCount((c) => c + 1)} style={actionBtnStyle}>
          Count: {count}
        </button>
        <button onClick={handleAlertCorrect} style={actionBtnStyle}>
          Alert (ref - always fresh)
        </button>
        <button onClick={handleAlertWithDep} style={actionBtnStyle}>
          Alert (dep - updates with count)
        </button>
      </div>
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
        Click count, then click alert buttons. Both show correct value after 1s delay.
      </div>
    </DemoSection>
  );
}

/**
 * Demo 2: Missing useMemo dependencies.
 * Bug: if useMemo deps miss `multiplier`, computed value becomes stale.
 */
function MemoDepDemo() {
  const [items] = useState(() => Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() * 100 })));
  const [multiplier, setMultiplier] = useState(1);
  const [filter, setFilter] = useState(50);

  // CORRECT: both filter and multiplier in deps
  const computedItems = useMemo(() => {
    return items
      .filter((item) => item.value > filter)
      .map((item) => ({
        ...item,
        computed: Math.round(item.value * multiplier * 100) / 100,
      }));
  }, [items, filter, multiplier]);

  return (
    <DemoSection title="useMemo Dependency Tracking" breakpoint="Remove `multiplier` from deps array to create stale computation bug">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '13px' }}>
          Multiplier: {multiplier}x
          <input type="range" min="1" max="5" step="0.5" value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            style={{ marginLeft: '8px' }}
          />
        </label>
        <label style={{ fontSize: '13px' }}>
          Filter &gt; {filter}
          <input type="range" min="0" max="100" value={filter}
            onChange={(e) => setFilter(parseInt(e.target.value))}
            style={{ marginLeft: '8px' }}
          />
        </label>
      </div>
      <div style={{ fontSize: '13px', color: '#374151', marginTop: '8px' }}>
        {computedItems.length} items | First: {computedItems[0]?.computed ?? 'N/A'} | 
        Last: {computedItems[computedItems.length - 1]?.computed ?? 'N/A'}
      </div>
    </DemoSection>
  );
}

/**
 * Demo 3: Incorrect useEffect dependencies.
 * Bug: if fetchCount is in deps but shouldn't be (or object dep), causes infinite loop.
 */
function EffectDepDemo() {
  const [fetchCount, setFetchCount] = useState(0);
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);
  const [data, setData] = useState(null);
  const fetchCountRef = useRef(0);

  // CORRECT: uses ref for tracking, boolean for triggering
  useEffect(() => {
    if (!autoFetchEnabled) return;

    const timer = setInterval(() => {
      fetchCountRef.current += 1;
      setFetchCount(fetchCountRef.current);
      setData({ value: Math.random(), fetchedAt: Date.now() });
    }, 2000);

    return () => clearInterval(timer);
  }, [autoFetchEnabled]); // Only depends on the toggle, NOT on fetchCount

  return (
    <DemoSection title="useEffect Dependency Management" breakpoint="Add `fetchCount` to deps array to create infinite re-render loop">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => setAutoFetchEnabled((e) => !e)}
          style={{
            ...actionBtnStyle,
            backgroundColor: autoFetchEnabled ? '#dcfce7' : 'white',
            color: autoFetchEnabled ? '#166534' : '#374151',
          }}
        >
          Auto-fetch: {autoFetchEnabled ? 'ON' : 'OFF'}
        </button>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Fetches: {fetchCount} | Data: {data ? data.value.toFixed(4) : 'N/A'}
        </span>
      </div>
    </DemoSection>
  );
}

/**
 * Demo 4: useCallback with incorrect dependencies.
 * Bug: if handler doesn't include `prefix` in deps, it captures stale prefix.
 */
function CallbackDepDemo() {
  const [prefix, setPrefix] = useState('Hello');
  const [log, setLog] = useState([]);

  // CORRECT: includes prefix in deps
  const handleClick = useCallback((name) => {
    const message = `${prefix}, ${name}! (at ${new Date().toLocaleTimeString()})`;
    setLog((prev) => [...prev.slice(-4), message]);
  }, [prefix]);

  return (
    <DemoSection title="useCallback Dependency Accuracy" breakpoint="Empty the deps array to capture stale `prefix` value">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={prefix} onChange={(e) => setPrefix(e.target.value)} style={inputStyle}>
          <option value="Hello">Hello</option>
          <option value="Hi">Hi</option>
          <option value="Hey">Hey</option>
          <option value="Greetings">Greetings</option>
        </select>
        {['Alice', 'Bob', 'Charlie'].map((name) => (
          <button key={name} onClick={() => handleClick(name)} style={actionBtnStyle}>
            Greet {name}
          </button>
        ))}
      </div>
      {log.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'monospace', color: '#4b5563' }}>
          {log.map((msg, i) => <div key={i}>{msg}</div>)}
        </div>
      )}
    </DemoSection>
  );
}

function DemoSection({ title, breakpoint, children }) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '12px',
    }}>
      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#111827' }}>{title}</h4>
      <div style={{
        fontSize: '11px',
        color: '#dc2626',
        marginBottom: '12px',
        fontStyle: 'italic',
      }}>
        Breakpoint: {breakpoint}
      </div>
      {children}
    </div>
  );
}

function WebSocketSettings() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>WebSocket Configuration</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SettingRow label="Server URL" value="ws://localhost:3001/ws" />
        <SettingRow label="Heartbeat Interval" value="30,000ms" />
        <SettingRow label="Heartbeat Timeout" value="5,000ms" />
        <SettingRow label="Max Reconnect Attempts" value="10" />
        <SettingRow label="Base Reconnect Delay" value="1,000ms" />
        <SettingRow label="Max Queue Size" value="100 messages" />
      </div>
    </div>
  );
}

function PerformanceSettings() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>Performance Configuration</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SettingRow label="Event Loop Sample Interval" value="200ms" />
        <SettingRow label="Lag Threshold" value="50ms" />
        <SettingRow label="Stall Threshold" value="200ms" />
        <SettingRow label="Max Render Samples" value="50" />
        <SettingRow label="Memory Check Interval" value="5,000ms" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Competency 10: Bundle Optimization Strategies
// ──────────────────────────────────────────────────────────
function BundleInfo() {
  const [dynamicModule, setDynamicModule] = useState(null);
  const [isLoadingModule, setIsLoadingModule] = useState(false);

  // Dynamic import demo - loads a module on demand
  const loadHeavyModule = useCallback(async () => {
    setIsLoadingModule(true);
    try {
      // Dynamic import — creates a separate chunk at build time
      const mod = await import('../../utils/heavyUtils');
      setDynamicModule({
        loaded: true,
        result: mod.computeChecksum('test-data-12345'),
        exportedFns: Object.keys(mod),
      });
    } catch (err) {
      setDynamicModule({ loaded: false, error: err.message });
    }
    setIsLoadingModule(false);
  }, []);

  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '16px' }}>Bundle Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SettingRow label="Build Tool" value="Vite 5.x" />
        <SettingRow label="Chunk Strategy" value="Manual (vendor-react, vendor-router)" />
        <SettingRow label="Code Splitting" value="Route-based (React.lazy)" />
        <SettingRow label="Tree Shaking" value="Enabled (esbuild)" />
        <SettingRow label="Source Maps" value="Enabled" />
        <SettingRow label="Minification" value="esbuild" />
        <SettingRow label="Chunk Size Limit" value="500KB" />
      </div>

      {/* Dynamic Import Demo */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
          Dynamic Import (Code Splitting)
        </h4>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          Click to dynamically import a heavy utility module. This creates a separate chunk
          that is only loaded on demand, reducing initial bundle size.
        </p>
        <button
          onClick={loadHeavyModule}
          disabled={isLoadingModule}
          style={actionBtnStyle}
        >
          {isLoadingModule ? 'Loading...' : dynamicModule?.loaded ? 'Reload Module' : 'Load Heavy Module'}
        </button>
        {dynamicModule?.loaded && (
          <div style={{
            marginTop: '8px',
            padding: '10px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            fontSize: '12px',
            color: '#166534',
          }}>
            Module loaded! Exports: [{dynamicModule.exportedFns.join(', ')}]
            <br />
            Checksum result: {dynamicModule.result}
          </div>
        )}
        {dynamicModule?.error && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>
            Error: {dynamicModule.error}
          </div>
        )}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#eff6ff',
        borderRadius: '6px',
        border: '1px solid #bfdbfe',
        fontSize: '13px',
        color: '#1e40af',
      }}>
        <strong>Splitting Strategy:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
          <li>All routes lazily loaded via <code>React.lazy()</code></li>
          <li>Vendor React/Router split into separate chunks</li>
          <li>Heavy utilities loaded on demand via <code>import()</code></li>
          <li>Tree shaking removes unused exports</li>
        </ul>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{value}</div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 14px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}>
      <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '13px',
  flex: 1,
};

const actionBtnStyle = {
  padding: '6px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
  whiteSpace: 'nowrap',
};

export { Settings };
