import { useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { WallData } from "@/types";

interface WallCellProps {
  wall: WallData;
  boxesPerWall: number;
  onClick: () => void;
  highlighted?: boolean;
  animating?: boolean;
  onAnimationEnd?: () => void;
  scrollIntoView?: boolean;
}

export function WallCell({
  wall,
  boxesPerWall,
  onClick,
  highlighted,
  animating,
  onAnimationEnd,
  scrollIntoView,
}: WallCellProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const isEmpty = wall.placements.length === 0;
  const isFull = wall.is_full;

  useEffect(() => {
    if (scrollIntoView && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scrollIntoView]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onAnimationEnd={animating ? onAnimationEnd : undefined}
      className={`flex min-h-16 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
        isEmpty
          ? "border-dashed border-muted-foreground/30 bg-muted/40 hover:bg-muted/60"
          : isFull
            ? "border-success/30 bg-card shadow-sm"
            : "border-border bg-card shadow-sm hover:bg-accent/50"
      } ${animating ? "wall-highlight" : ""} ${highlighted && !animating ? "ring-2 ring-primary" : ""}`}
    >
      {/* Wall number */}
      <span className="w-6 shrink-0 text-center text-xs font-medium text-muted-foreground">
        {wall.wall_number}
      </span>

      {/* Placement chips */}
      <div className="flex flex-1 flex-wrap gap-1">
        {wall.placements.map((pw) => {
          const isDone = pw.order.is_done;
          return (
            <Badge
              key={pw.placement.id}
              variant="secondary"
              className={`text-xs ${isDone ? "opacity-50 line-through" : ""}`}
            >
              #{pw.order.order_number} ({pw.placement.box_count})
            </Badge>
          );
        })}
      </div>

      {/* Box count */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {wall.total_boxes} / {boxesPerWall}
      </span>
    </button>
  );
}
