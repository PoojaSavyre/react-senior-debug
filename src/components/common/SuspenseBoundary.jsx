/**
 * SuspenseBoundary - Composed Suspense + ErrorBoundary wrapper.
 * Provides proper boundary placement with accessible fallback.
 *
 * Competency: React Suspense Implementation, React Component Suspense Management
 * Bug surface: missing suspense boundary, nested boundary conflicts,
 *              fallback not rendering, key prop missing, boundary placement issues
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { SuspenseFallback } from './SuspenseFallback';

function SuspenseBoundary({
  children,
  fallback = null,
  errorFallback = null,
  onError = null,
  onReset = null,
  suspenseKey = undefined,
  level = 'section',
}) {
  const fallbackUI = fallback || <SuspenseFallback level={level} />;

  return (
    <ErrorBoundary
      fallback={errorFallback || undefined}
      onError={onError}
      onReset={onReset}
    >
      <Suspense key={suspenseKey} fallback={fallbackUI}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export { SuspenseBoundary };
