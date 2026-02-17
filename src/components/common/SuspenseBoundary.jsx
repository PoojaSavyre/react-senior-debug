/**
 * SuspenseBoundary - Composed Suspense + ErrorBoundary wrapper.
 * Provides proper boundary placement with accessible fallback.
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
