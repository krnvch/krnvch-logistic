import { Package, BoxIcon, CircleCheck } from "lucide-react";
import type { OrderWithStatus } from "@/types";

interface SummaryBarProps {
  orders: OrderWithStatus[];
}

export function SummaryBar({ orders }: SummaryBarProps) {
  const totalOrders = orders.length;
  const totalBoxes = orders.reduce((sum, o) => sum + o.order.box_count, 0);
  const placedBoxes = orders.reduce((sum, o) => sum + o.placed_boxes, 0);
  const doneCount = orders.filter((o) => o.status === "done").length;

  return (
    <div className="text-muted-foreground flex items-center gap-2.5 text-xs sm:gap-3 sm:text-sm">
      <div className="flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{totalOrders}</span>
      </div>
      <span className="text-muted-foreground/40">·</span>
      <div className="flex items-center gap-1.5">
        <BoxIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>
          {placedBoxes}/{totalBoxes}
        </span>
      </div>
      <span className="text-muted-foreground/40">·</span>
      <div className="flex items-center gap-1.5">
        <CircleCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{doneCount}</span>
      </div>
    </div>
  );
}
