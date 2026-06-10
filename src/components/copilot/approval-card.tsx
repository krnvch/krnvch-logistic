import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  approvalStatus,
  type ApprovalPart,
  type ApprovalToolName,
} from "./approval-utils";

// Approval card (FR-CP-15, Wally pattern adapted to Grida skin):
// an active card with caption + summary + split Approve / Reject,
// collapsing to a one-line ✓/✕ state once decided.

export interface ApprovalDecideHandler {
  (
    toolCallId: string,
    toolName: ApprovalToolName,
    decision: "approved" | "rejected",
    always?: boolean
  ): void;
}

interface ApprovalCardProps {
  part: ApprovalPart;
  onDecide: ApprovalDecideHandler;
}

export function ApprovalCard({ part, onDecide }: ApprovalCardProps) {
  const { t } = useTranslation();
  const status = approvalStatus(part);

  const summary = t(`copilot.approval.summary.${part.toolName}`, {
    number: part.input?.order_number ?? "?",
  });

  // Decided → collapsed single line.
  if (status !== "pending") {
    const label =
      status === "approved"
        ? part.output?.auto
          ? t("copilot.approval.preApproved")
          : t("copilot.approval.approved")
        : status === "rejected"
          ? t("copilot.approval.rejected")
          : t("copilot.approval.failed");
    return (
      <div
        className={cn(
          "text-muted-foreground flex items-center gap-2 py-0.5 text-sm",
          status === "error" && "text-destructive"
        )}
      >
        {status === "approved" ? (
          <Check className="size-3.5 shrink-0" />
        ) : (
          <X className="size-3.5 shrink-0" />
        )}
        <span className="min-w-0 flex-1">
          {summary} · {label}
        </span>
      </div>
    );
  }

  const ready = part.state === "input-available";

  return (
    <div className="border-warning my-1 flex flex-col gap-2.5 border-2 p-3">
      <div className="text-warning flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <ShieldAlert className="size-3.5 shrink-0" />
        {t("copilot.approval.required")}
      </div>
      <p className="text-sm">{summary}</p>
      <div className="flex items-center gap-2">
        {/* Split button: two identical primary segments, 1px gap as the divider. */}
        <div className="flex gap-px">
          <Button
            size="sm"
            disabled={!ready}
            onClick={() =>
              onDecide(part.toolCallId, part.toolName, "approved")
            }
          >
            {t("copilot.approval.allowOnce")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="px-1.5"
                disabled={!ready}
                aria-label={t("copilot.approval.allowAlways")}
              >
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  onDecide(part.toolCallId, part.toolName, "approved", true)
                }
              >
                {t("copilot.approval.allowAlways")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={!ready}
          onClick={() => onDecide(part.toolCallId, part.toolName, "rejected")}
        >
          {t("copilot.approval.reject")}
        </Button>
      </div>
    </div>
  );
}
