"use client";

import * as Sentry from "@sentry/nextjs";

function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";
  const enableProfiling =
    process.env.NEXT_PUBLIC_ENABLE_SENTRY_PROFILING === "true";

  if (!dsn) {
    console.warn(
      "NEXT_PUBLIC_SENTRY_DSN not configured. Error tracking disabled.",
    );
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: environment === "production" ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    debug: environment === "development",
    beforeSend(event, hint) {
      // Filter out development/localhost errors
      if (process.env.NODE_ENV === "development") {
        return null;
      }
      return event;
    },
  });
}

// Only initialize in browser environment
if (typeof window !== "undefined") {
  initSentry();
}

export { Sentry };
