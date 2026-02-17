/**
 * Router configuration with lazy-loaded routes and Suspense boundaries.
 */

import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { SuspenseBoundary } from './components/common/SuspenseBoundary';
import { SuspenseFallback } from './components/common/SuspenseFallback';

// Lazy load all pages - each becomes a separate chunk
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LiveFeedPage = lazy(() => import('./pages/LiveFeedPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

/**
 * Wrap each lazy page with its own Suspense boundary.
 * This creates route-level boundaries separate from the app-level boundary.
 */
function LazyRoute({ children, routeKey }) {
  return (
    <SuspenseBoundary
      suspenseKey={routeKey}
      fallback={<SuspenseFallback level="page" message="Loading page..." />}
      level="page"
    >
      {children}
    </SuspenseBoundary>
  );
}

const routes = [
  {
    path: '/',
    element: (
      <LazyRoute routeKey="dashboard">
        <DashboardPage />
      </LazyRoute>
    ),
  },
  {
    path: '/feed',
    element: (
      <LazyRoute routeKey="feed">
        <LiveFeedPage />
      </LazyRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <LazyRoute routeKey="users">
        <UsersPage />
      </LazyRoute>
    ),
  },
  {
    path: '/analytics',
    element: (
      <LazyRoute routeKey="analytics">
        <AnalyticsPage />
      </LazyRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <LazyRoute routeKey="settings">
        <SettingsPage />
      </LazyRoute>
    ),
  },
];

export { routes };
