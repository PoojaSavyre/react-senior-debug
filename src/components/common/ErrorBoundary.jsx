/**
 * ErrorBoundary - Catches rendering errors and displays fallback UI.
 *
 * Competency: React Suspense Implementation, React Component Suspense Management
 * Bug surface: suspense not catching errors, missing error boundary with suspense,
 *              boundary error propagation, boundary unmounting issues
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
        });
      }

      return (
        <div
          role="alert"
          style={{
            padding: '20px',
            margin: '10px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Something went wrong</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#b91c1c' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
