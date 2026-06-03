import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@sentry/react";
import { Toaster } from "@/components/ui/sonner";
import { ErrorFallback } from "@/components/error-fallback";
import App from "./App.tsx";
import "@fontsource-variable/zalando-sans";
import "@fontsource-variable/zalando-sans-expanded";
import "./lib/i18n";
import "./lib/analytics";
import "./lib/sentry";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" storageKey="theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorBoundary fallback={<ErrorFallback />}>
            <App />
          </ErrorBoundary>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
