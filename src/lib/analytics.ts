import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: "https://us.i.posthog.com",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage",
  });
}

export function identify(
  userId: string,
  properties?: Record<string, string | undefined>
) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

export function reset() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

export function track(
  event: string,
  properties?: Record<string, unknown>
) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}
