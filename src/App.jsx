/**
 * App - Root component with top-level Suspense boundary, Router, and Context providers.
 *
 * Competency: React Suspense Implementation, React Component Suspense Management
 * Bug surface: suspense with react strict mode, suspense boundary placement,
 *              context integration with suspense, missing error boundary,
 *              concurrent rendering, SSR considerations
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SuspenseBoundary } from './components/common/SuspenseBoundary';
import { SuspenseFallback } from './components/common/SuspenseFallback';
import { PerformanceOverlay } from './components/common/PerformanceOverlay';
import { WebSocketProvider } from './context/WebSocketContext';
import { CacheProvider } from './context/CacheContext';
import { PerformanceProvider } from './context/PerformanceContext';

const WS_URL = `ws://${window.location.hostname}:3001/ws`;
const AUTH_TOKEN = 'valid-auth-token-2024';

// Lazy load all pages - each becomes a separate bundle chunk
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LiveFeedPage = lazy(() => import('./pages/LiveFeedPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Sidebar currentPath={location.pathname} />
      <main style={{ flex: 1, backgroundColor: '#f9fafb', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function Sidebar({ currentPath }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/feed', label: 'Live Feed', icon: '📡' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav style={{
      width: '220px',
      backgroundColor: '#111827',
      color: '#e5e7eb',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '0 20px 20px',
        borderBottom: '1px solid #1f2937',
        marginBottom: '10px',
      }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>
          Analytics Hub
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
          Real-time Dashboard
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                color: isActive ? 'white' : '#9ca3af',
                backgroundColor: isActive ? '#1f2937' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? '500' : '400',
                transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Wraps lazy-loaded routes with route-level Suspense boundaries.
 */
function LazyRoute({ children }) {
  return (
    <SuspenseBoundary
      fallback={<SuspenseFallback level="page" message="Loading page..." />}
      level="page"
    >
      {children}
    </SuspenseBoundary>
  );
}

function App() {
  return (
    <React.StrictMode>
      {/* Top-level Error Boundary */}
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '40px',
          }}>
            <h1 style={{ color: '#dc2626' }}>Application Error</h1>
            <p style={{ color: '#6b7280' }}>{error?.message}</p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reload Application
            </button>
          </div>
        )}
      >
        {/* Top-level Suspense Boundary */}
        <Suspense fallback={<SuspenseFallback level="page" message="Loading application..." />}>
          <BrowserRouter>
            {/* Context Providers - inside Router so routes can access them */}
            <PerformanceProvider trackingEnabled={true}>
              <CacheProvider options={{ maxEntries: 200, defaultTTL: 60000 }}>
                <WebSocketProvider url={WS_URL} authToken={AUTH_TOKEN}>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<LazyRoute><DashboardPage /></LazyRoute>} />
                      <Route path="/feed" element={<LazyRoute><LiveFeedPage /></LazyRoute>} />
                      <Route path="/users" element={<LazyRoute><UsersPage /></LazyRoute>} />
                      <Route path="/analytics" element={<LazyRoute><AnalyticsPage /></LazyRoute>} />
                      <Route path="/settings" element={<LazyRoute><SettingsPage /></LazyRoute>} />
                    </Routes>
                  </AppLayout>
                  <PerformanceOverlay />
                </WebSocketProvider>
              </CacheProvider>
            </PerformanceProvider>
          </BrowserRouter>
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

export default App;
