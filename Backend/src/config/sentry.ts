import * as Sentry from "@sentry/node";
import { logger } from "../utils/logger.js";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || "development";

  if (!dsn) {
    if (environment === "development") {
      logger.warn("SENTRY_DSN not configured. Error tracking disabled.");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    debug: environment === "development",
    maxBreadcrumbs: 100,
    attachStacktrace: true,
    beforeSend(event) {
      // Filter out health check endpoints
      if (event.request?.url?.includes("/health")) {
        return null;
      }
      return event;
    },
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Network errors
      "NetworkError",
      "timeout",
      "ERR_INTERNET_DISCONNECTED",
    ],
  });

  logger.info({ environment }, "Sentry initialized");
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        app: context,
      },
    });
  }
  logger.error({ error: error.message, context }, "Exception captured");
}

export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info",
) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
  logger.info(message);
}

export { Sentry };
