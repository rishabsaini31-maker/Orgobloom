import pino, { Logger } from "pino";
import { config } from "../config/env.js";

/**
 * Create and configure Pino logger instance
 * Provides structured JSON logging with proper levels and transport
 */
const createLogger = (): Logger => {
  const isDevelopment = config.NODE_ENV !== "production";

  // Development: Pretty-printed logs with colors
  // Production: Structured JSON logs
  const logger = pino(
    {
      level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
      formatters: {
        // Custom level formatting
        level: (label) => {
          return { level: label.toUpperCase() };
        },
        // Bindings added context to every log
        bindings: (bindings) => {
          return {
            pid: bindings.pid,
            hostname: bindings.hostname,
            version: process.env.npm_package_version,
          };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    isDevelopment
      ? pino.transport({
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname,version",
            singleLine: false,
            messageFormat: "{levelLabel} - {msg}",
          },
        })
      : undefined,
  );

  return logger;
};

export const logger: Logger = createLogger();

/**
 * Log HTTP request/response
 */
export function logHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestId: string,
) {
  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
  logger[level](
    {
      requestId,
      method,
      path,
      statusCode,
      durationMs: duration,
    },
    `HTTP ${method} ${path}`,
  );
}

/**
 * Log database operation
 */
export function logDatabase(
  operation: "query" | "insert" | "update" | "delete" | "transaction",
  table: string,
  duration: number,
  requestId?: string,
  error?: Error,
) {
  const level = error ? "error" : "debug";
  logger[level](
    {
      requestId,
      operation,
      table,
      durationMs: duration,
      error: error?.message,
    },
    `Database ${operation} on ${table}`,
  );
}

/**
 * Log authentication event
 */
export function logAuth(
  event: "login" | "logout" | "register" | "token_refresh" | "auth_failed",
  userId?: string,
  requestId?: string,
  details?: Record<string, any>,
) {
  const level = event === "auth_failed" ? "warn" : "info";
  logger[level](
    {
      requestId,
      event,
      userId,
      ...details,
    },
    `Authentication: ${event}`,
  );
}

/**
 * Log business events (orders, payments, etc.)
 */
export function logBusiness(
  event: string,
  context: Record<string, any>,
  requestId?: string,
) {
  logger.info(
    {
      requestId,
      event,
      ...context,
    },
    `Business Event: ${event}`,
  );
}

/**
 * Log email operation
 */
export function logEmail(
  status: "sent" | "failed" | "queued",
  to: string,
  subject: string,
  duration?: number,
  requestId?: string,
  error?: Error,
) {
  const level = status === "failed" ? "error" : "info";
  logger[level](
    {
      requestId,
      status,
      to,
      subject,
      durationMs: duration,
      error: error?.message,
    },
    `Email ${status}: ${subject}`,
  );
}

/**
 * Log external API call
 */
export function logExternalApi(
  service: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  requestId?: string,
  error?: Error,
) {
  const level = statusCode >= 500 || error ? "error" : statusCode >= 400 ? "warn" : "info";
  logger[level](
    {
      requestId,
      service,
      endpoint,
      statusCode,
      durationMs: duration,
      error: error?.message,
    },
    `External API: ${service} ${endpoint}`,
  );
}

/**
 * Log error with full context
 */
export function logError(
  message: string,
  error: Error,
  context?: Record<string, any>,
  requestId?: string,
) {
  logger.error(
    {
      requestId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    message,
  );
}

/**
 * Log warning
 */
export function logWarning(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
) {
  logger.warn(
    {
      requestId,
      ...context,
    },
    message,
  );
}

export default logger;
