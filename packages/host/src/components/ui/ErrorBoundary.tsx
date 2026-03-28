/**
 * ErrorBoundary — Class component that catches render-phase errors.
 *
 * WHY this must be a class component (not a hook):
 *   React's error boundary lifecycle methods — getDerivedStateFromError
 *   and componentDidCatch — have no hooks equivalent. This is intentional:
 *   error boundaries need to intercept errors during the render phase
 *   itself, before function component bodies can run. Until React provides
 *   a hooks-based API, class components are the only option.
 *
 * WHY wrap each page (not the whole app):
 *   A single top-level boundary catches everything but shows a blank app
 *   on any error. Wrapping at the page level means:
 *     - A crash in Analytics doesn't kill Dashboard or Sidebar
 *     - The user can navigate away and recover without a full reload
 *     - Each page can have its own retry logic
 *
 * PLACEMENT: ErrorBoundary sits OUTSIDE Suspense in AppShell.
 *   - Suspense handles loading (lazy import)
 *   - ErrorBoundary handles crashes (runtime errors)
 *   The order matters: <ErrorBoundary><Suspense> ensures that if the lazy
 *   load itself throws (e.g. network error on chunk fetch), ErrorBoundary
 *   catches it.
 */
import React from 'react';

interface Props {
  children:  React.ReactNode;
  /** Optional custom fallback instead of the default error UI */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false, error: null };

  /**
   * Called during render when a descendant throws.
   * Returns new state to trigger the error UI.
   * Must be static — React calls it as a class method, not on an instance.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Called after the DOM has been updated with the error UI.
   * Use for logging to an error reporting service (Sentry, Datadog, etc).
   * componentInfo.componentStack is a React-generated stack trace.
   */
  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught render error:', error);
    console.error('[ErrorBoundary] Component stack:',    info.componentStack);
    // Step 13: reportError(error, { componentStack: info.componentStack });
  }

  /** Clears the error state so the child tree re-renders from scratch */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback takes precedence
    if (this.props.fallback) {
      return <>{this.props.fallback}</>;
    }

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__icon" aria-hidden="true">⚠</div>
        <h2 className="error-boundary__title">Something went wrong</h2>
        <p className="error-boundary__message">
          {this.state.error?.message ?? 'An unexpected error occurred in this page.'}
        </p>
        <button
          className="btn btn--primary"
          type="button"
          onClick={this.handleReset}
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
