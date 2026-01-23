'use client';

import { ReactNode, useCallback } from 'react';
import { ErrorBoundary } from '../shared/ErrorBoundary';

/**
 * ErrorBoundaryProvider props
 */
interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

/**
 * ErrorBoundaryProvider component
 * Requirements: 8.5, error handling
 * - Wrap pages with error boundaries
 * - Display user-friendly error messages
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to monitoring service in production
    // For now, just log to console
    console.error('App Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // In production, you would send this to an error tracking service like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }, []);

  const handleReset = useCallback(() => {
    // Clear any error state in the app
    // This could include clearing localStorage, resetting stores, etc.
    console.log('Error boundary reset');
  }, []);

  return (
    <ErrorBoundary onError={handleError} onReset={handleReset}>
      {children}
    </ErrorBoundary>
  );
}
