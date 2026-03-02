"use client";

import React, { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: unknown[];
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component that catches errors in child components
 * and displays a fallback UI with retry capability
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
      console.error("Error info:", errorInfo);
    }

    // Update state with error details
    this.setState((prevState) => ({
      ...prevState,
      errorInfo,
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { contexts: { errorBoundary: errorInfo } });
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary if resetKeys changes
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, i) => key !== prevProps.resetKeys![i])
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              {/* Error Icon */}
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Please try again or contact
                support if the problem persists.
              </p>

              {/* Error Details in Development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 bg-gray-100 rounded p-4 text-left overflow-auto max-h-40">
                  <p className="font-mono text-sm text-red-600 break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <p className="font-mono text-xs text-gray-600 mt-2 break-words">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.resetErrorBoundary}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>

                <button
                  onClick={() => (window.location.href = "/")}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                >
                  Go Home
                </button>
              </div>

              {/* Support Info */}
              <p className="text-gray-500 text-sm mt-6">
                Error ID:{" "}
                {this.state.error?.message.substring(0, 8) || "UNKNOWN"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for specific page error handling
 */
export function PageErrorBoundary({
  children,
  pageName,
}: {
  children: ReactNode;
  pageName: string;
}) {
  return (
    <ErrorBoundary
      onError={(error, info) => {
        console.error(`Error in ${pageName}:`, error);
        // Send to error tracking service
        // Sentry.captureException(error, { tags: { page: pageName } });
      }}
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {pageName} Unavailable
              </h1>
              <p className="text-gray-600 mb-6">
                We're having trouble loading the {pageName.toLowerCase()}.
                Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Async component wrapper for handling errors in async operations
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    pageName?: string;
    onError?: (error: Error, info: React.ErrorInfo) => void;
  },
) {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary
      onError={options?.onError}
      fallback={
        options?.pageName ? (
          <PageErrorBoundary pageName={options.pageName}>
            <Component {...props} />
          </PageErrorBoundary>
        ) : undefined
      }
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WithErrorBoundary;
}

export default ErrorBoundary;
