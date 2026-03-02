import { AxiosError } from "axios";

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: Record<string, string>;
  statusCode?: number;
}

export interface ParsedError {
  userMessage: string;
  technicalMessage?: string;
  statusCode: number;
  isRetryable: boolean;
  errorCode: string;
}

/**
 * Categorize axios errors and provide user-friendly messages
 */
export function parseApiError(error: unknown): ParsedError {
  // Handle network errors
  if (!error) {
    return {
      userMessage: "An unexpected error occurred",
      statusCode: 0,
      isRetryable: true,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  // Handle axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status || 0;
    const data = error.response?.data as ApiErrorResponse;

    switch (status) {
      case 400:
        return {
          userMessage:
            data?.message ||
            data?.error ||
            "Invalid request. Please check your input",
          technicalMessage: JSON.stringify(data?.details),
          statusCode: 400,
          isRetryable: false,
          errorCode: "BAD_REQUEST",
        };

      case 401:
        return {
          userMessage: "Your session has expired. Please log in again",
          statusCode: 401,
          isRetryable: false,
          errorCode: "UNAUTHORIZED",
        };

      case 403:
        return {
          userMessage: "You don't have permission to perform this action",
          statusCode: 403,
          isRetryable: false,
          errorCode: "FORBIDDEN",
        };

      case 404:
        return {
          userMessage: "The resource you're looking for doesn't exist",
          statusCode: 404,
          isRetryable: false,
          errorCode: "NOT_FOUND",
        };

      case 409:
        return {
          userMessage:
            data?.message || "This action conflicts with existing data",
          statusCode: 409,
          isRetryable: false,
          errorCode: "CONFLICT",
        };

      case 422:
        return {
          userMessage: "Invalid data provided. Please check your input",
          technicalMessage: JSON.stringify(data?.details),
          statusCode: 422,
          isRetryable: false,
          errorCode: "UNPROCESSABLE_ENTITY",
        };

      case 429:
        return {
          userMessage: "Too many requests. Please wait a moment and try again",
          statusCode: 429,
          isRetryable: true,
          errorCode: "RATE_LIMITED",
        };

      case 500:
        return {
          userMessage: "Server error. Our team has been notified",
          technicalMessage: data?.message,
          statusCode: 500,
          isRetryable: true,
          errorCode: "INTERNAL_SERVER_ERROR",
        };

      case 502:
      case 503:
      case 504:
        return {
          userMessage:
            "Service temporarily unavailable. Please try again later",
          statusCode: status,
          isRetryable: true,
          errorCode: "SERVICE_UNAVAILABLE",
        };

      case 0:
        // Network timeout or connection error
        return {
          userMessage:
            error.code === "ECONNABORTED"
              ? "Request took too long. Please check your connection"
              : "Unable to connect to server. Please check your internet connection",
          technicalMessage: error.message,
          statusCode: 0,
          isRetryable: true,
          errorCode: error.code || "NETWORK_ERROR",
        };

      default:
        return {
          userMessage:
            data?.message ||
            data?.error ||
            "An unexpected error occurred. Please try again",
          statusCode: status,
          isRetryable: false,
          errorCode: "UNKNOWN_ERROR",
        };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      userMessage: error.message || "An unexpected error occurred",
      statusCode: 0,
      isRetryable: false,
      errorCode: "ERROR",
    };
  }

  return {
    userMessage: "An unexpected error occurred",
    statusCode: 0,
    isRetryable: false,
    errorCode: "UNKNOWN_ERROR",
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.isRetryable;
}

/**
 * Check if error is auth-related (401/403)
 */
export function isAuthError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return (
    parsed.errorCode === "UNAUTHORIZED" || parsed.errorCode === "FORBIDDEN"
  );
}

/**
 * Check if error is rate limiting (429)
 */
export function isRateLimited(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.errorCode === "RATE_LIMITED";
}

/**
 * Extract field errors from validation errors
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError && error.response?.status === 422) {
    const data = error.response.data as ApiErrorResponse;
    return data.details || {};
  }
  return {};
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: unknown): string {
  const parsed = parseApiError(error);
  return parsed.userMessage;
}

/**
 * Log error for debugging/monitoring
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", { error, context });
  }

  // TODO: Send to error tracking service (Sentry, etc.)
  // Sentry.captureException(error, { extra: context });
}

export default {
  parseApiError,
  isRetryableError,
  isAuthError,
  isRateLimited,
  extractFieldErrors,
  formatErrorForDisplay,
  logError,
};
