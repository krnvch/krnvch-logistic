import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Pencil,
  Trash2,
  Clock,
  CircleCheck,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import type { OrderWithStatus } from "@/types";

interface OrderCardProps {
  data: OrderWithStatus;
  isOperator: boolean;
  isReadOnly?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
  onUndoDone: () => void;
  onTap?: () => void;
  highlighted?: boolean;
}

const statusConfig = {
  pending: { className: "bg-secondary text-secondary-foreground" },
  loaded: { className: "bg-success text-success-foreground" },
  done: { className: "bg-muted text-muted-foreground" },
};

export function OrderCard({
  data,
  isOperator,
  isReadOnly = false,
  onEdit,
  onDelete,
  onMarkDone,
  onUndoDone,
  onTap,
  highlighted,
}: OrderCardProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { order, placed_boxes, status } = data;
  const isDone = status === "done";
  const isUrgent = order.priority === "urgent";
  const progress =
    order.box_count > 0 ? (placed_boxes / order.box_count) * 100 : 0;
  const badge = statusConfig[status];

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  return (
    <Card
      ref={ref}
      className={`cursor-pointer transition-shadow ${isDone ? "opacity-50" : ""} ${highlighted ? "ring-primary ring-2" : ""} ${isUrgent && !isDone ? "border-l-warning border-l-4" : ""}`}
      onClick={onTap}
    >
      <CardContent className="grid gap-2.5 p-4">
        {/* Top row: order number + status badge */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">#{order.order_number}</span>
          <div className="flex items-center gap-1.5">
            {isUrgent && (
              <Badge className="bg-warning text-warning-foreground">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {t("orders.priority.urgent")}
              </Badge>
            )}
            <Badge variant="secondary" className={badge.className}>
              {t(`orders.status.${status}`)}
            </Badge>
          </div>
        </div>

        {/* Client name */}
        <p className="text-sm">{order.client_name}</p>

        {/* Progress bar */}
        <div className="grid gap-1">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>
              {placed_boxes} / {order.box_count} {t("orders.boxes")}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            {order.pickup_time && (
              <>
                <Clock className="h-3 w-3" />
                <span>{order.pickup_time}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isReadOnly ? null : isDone ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onUndoDone();
                }}
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" />
                {t("action.undo")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkDone();
                  }}
                >
                  <CircleCheck className="mr-1 h-3.5 w-3.5" />
                  {t("action.markDone")}
                </Button>
                {isOperator && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Edit order"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost-destructive"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Delete order"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
