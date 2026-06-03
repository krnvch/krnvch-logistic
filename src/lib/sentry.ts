import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// Mirrors the analytics module: with no DSN configured, Sentry stays a no-op.
// Keeps local dev and forks (without the key) free of error reports.
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Tag events by build mode so production noise is separable from dev.
    environment: import.meta.env.MODE,
    // Privacy: do not auto-attach PII (IP address, cookies, request bodies).
    sendDefaultPii: false,
  });
}
