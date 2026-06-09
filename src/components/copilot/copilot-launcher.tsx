import { useTranslation } from "react-i18next";
import { Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

export function CopilotLauncher() {
  const { t } = useTranslation();
  const { open, setOpen } = useCopilot();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("copilot.launcher.aria")}
      aria-pressed={open}
      onClick={() => setOpen(!open)}
      className={cn(open && "text-primary")}
    >
      <Rabbit className="h-4 w-4" />
    </Button>
  );
}
