import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  groupThreads,
  type ChatThread,
  type ThreadGroup,
} from "./thread-utils";

interface ThreadSwitcherProps {
  threads: ChatThread[];
  currentThreadId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const GROUP_ORDER: ThreadGroup[] = ["today", "lastWeek", "older"];

// Breadcrumb thread switcher in Mira's panel header (FR-CP-14, Wally
// "History" pattern): searchable list grouped by recency, current thread
// checked, delete behind a confirm dialog.
export function ThreadSwitcher({
  threads,
  currentThreadId,
  disabled,
  onSelect,
  onNew,
  onDelete,
}: ThreadSwitcherProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatThread | null>(null);

  const current = threads.find((thread) => thread.id === currentThreadId);
  const title = current?.title || t("copilot.thread.new");

  const filtered = search.trim()
    ? threads.filter((thread) =>
        thread.title.toLowerCase().includes(search.trim().toLowerCase())
      )
    : threads;
  const groups = groupThreads(filtered, new Date());

  return (
    <>
      <DropdownMenu onOpenChange={() => setSearch("")}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label={t("copilot.thread.switcherAria")}
            className="min-w-0 flex-initial justify-start gap-1 px-1.5 font-sans font-normal"
          >
            <span className="truncate">{title}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <div className="p-1.5">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={t("copilot.thread.searchPlaceholder")}
              className="h-8"
            />
          </div>
          <DropdownMenuItem onSelect={onNew}>
            <span className="flex-1">{t("copilot.thread.new")}</span>
            {!currentThreadId && <Check className="size-4" />}
          </DropdownMenuItem>
          {filtered.length === 0 && (
            <p className="text-muted-foreground/70 px-2 py-2 text-sm">
              {t("copilot.thread.empty")}
            </p>
          )}
          {GROUP_ORDER.map((group) =>
            groups[group].length === 0 ? null : (
              <div key={group}>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {t(`copilot.thread.${group}`)}
                </DropdownMenuLabel>
                {groups[group].map((thread) => (
                  <DropdownMenuItem
                    key={thread.id}
                    onSelect={() => onSelect(thread.id)}
                    className="group/thread"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {thread.title || t("copilot.thread.new")}
                    </span>
                    {thread.id === currentThreadId && (
                      <Check className="size-4 shrink-0" />
                    )}
                    <button
                      type="button"
                      aria-label={t("copilot.thread.deleteAria")}
                      className={cn(
                        "text-destructive shrink-0 p-0.5 opacity-0 transition-opacity",
                        "group-hover/thread:opacity-100 focus-visible:opacity-100"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(thread);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </div>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dialog.deleteThread.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.deleteThread.description", {
                title: deleteTarget?.title || t("copilot.thread.new"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
