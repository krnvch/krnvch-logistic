import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// Rendered by the Sentry ErrorBoundary when a render crash is caught,
// replacing the "white screen of death" with a recoverable message.
export function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-bold">
        {t("error.title", "Something went wrong")}
      </h1>
      <p className="text-muted-foreground max-w-md">
        {t(
          "error.description",
          "The app hit an unexpected error. We've been notified and are looking into it."
        )}
      </p>
      <Button onClick={() => window.location.reload()}>
        {t("error.retry", "Reload")}
      </Button>
    </div>
  );
}
