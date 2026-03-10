"use client";

import React, { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component that catches errors in child components
 * for the Admin dashboard
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
      console.error("[ERROR_BOUNDARY] Error caught:", error);
      console.error(
        "[ERROR_BOUNDARY] Component stack:",
        errorInfo.componentStack,
      );
    }

    // Update state with error details
    this.setState((prevState) => ({
      ...prevState,
      errorInfo,
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external error tracking service
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
            <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-red-200">
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
                We encountered an unexpected error in the admin dashboard.
                Please try again.
              </p>

              {/* Error Details in Development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 bg-red-50 rounded p-4 text-left overflow-auto max-h-40 border border-red-200">
                  <p className="font-mono text-xs text-red-700 break-words">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <p className="font-mono text-xs text-gray-600 mt-3 break-words">
                      <strong>Stack:</strong>
                      <br />
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
                  onClick={() => (window.location.href = "/login")}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                >
                  Go to Login
                </button>
              </div>

              {/* Support Info */}
              <p className="text-gray-500 text-xs mt-6">
                Error ID:{" "}
                {this.state.error?.message.substring(0, 12) || "UNKNOWN"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
