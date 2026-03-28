import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";

const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;

interface SuggestionDialogProps {
  userRole: string;
}

export function SuggestionDialog({ userRole }: SuggestionDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = text.trim().length >= MIN_LENGTH;

  async function handleSubmit() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    const page = window.location.pathname;

    const { data, error } = await supabase.functions.invoke(
      "create-suggestion",
      {
        body: { text: text.trim(), userRole, page },
      }
    );

    setSubmitting(false);

    if (error || !data?.success) {
      toast.error(t("suggestion.error"));
      track("suggestion_failed", {
        role: userRole,
        page,
        error: error?.message ?? "unknown",
      });
      return;
    }

    track("suggestion_submitted", {
      role: userRole,
      page,
      text_length: text.trim().length,
    });

    setText("");
    setOpen(false);
    toast.success(t("suggestion.success"));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("suggestion.ariaLabel")}>
          <Lightbulb className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("suggestion.title")}</DialogTitle>
          <DialogDescription>{t("suggestion.reassurance")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            placeholder={t("suggestion.placeholder")}
            maxLength={MAX_LENGTH}
            rows={5}
            disabled={submitting}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {text.trim().length < MIN_LENGTH && text.length > 0
                ? t("suggestion.minLength")
                : ""}
            </span>
            <span>
              {text.length} / {MAX_LENGTH}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("suggestion.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
