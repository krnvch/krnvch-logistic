import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Pencil, CircleCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import type {
  WallData,
  OrderWithStatus,
  PlacementInsert,
  PlacementUpdate,
} from "@/types";

interface WallPopoverProps {
  open: boolean;
  onClose: () => void;
  wall: WallData | null;
  orders: OrderWithStatus[];
  shipmentId: string;
  boxesPerWall: number;
  isOperator: boolean;
  isReadOnly?: boolean;
  onCreatePlacement: (data: PlacementInsert) => Promise<unknown>;
  onUpdatePlacement: (
    data: PlacementUpdate & { id: string }
  ) => Promise<unknown>;
  onDeletePlacement: (id: string) => Promise<unknown>;
  onMarkDone: (orderId: string) => Promise<unknown>;
  onUndoDone: (orderId: string) => Promise<unknown>;
}

export function WallPopover({
  open,
  onClose,
  wall,
  orders,
  shipmentId,
  boxesPerWall,
  isOperator,
  isReadOnly = false,
  onCreatePlacement,
  onUpdatePlacement,
  onDeletePlacement,
  onMarkDone,
  onUndoDone,
}: WallPopoverProps) {
  const { t } = useTranslation();
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBoxCount, setEditBoxCount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!wall) return null;

  // Orders with remaining boxes (excluding already placed on this wall)
  const availableOrders = orders.filter((o) => {
    if (o.status === "done") return false;
    if (o.remaining_boxes <= 0) return false;
    const alreadyOnWall = wall.placements.some(
      (pw) => pw.order.id === o.order.id
    );
    return !alreadyOnWall;
  });

  const maxBoxes = () => {
    const order = orders.find((o) => o.order.id === selectedOrderId);
    if (!order) return 0;
    return Math.min(order.remaining_boxes, wall.remaining_capacity);
  };

  const handleAdd = async () => {
    if (!selectedOrderId) {
      toast.error(t("wall.error.selectOrder"));
      return;
    }
    const count = parseInt(boxCount, 10);
    if (isNaN(count) || count < 1) {
      toast.error(t("wall.error.boxCount"));
      return;
    }
    const max = maxBoxes();
    if (count > max) {
      toast.error(t("wall.error.maxBoxes", { max }));
      return;
    }

    setSubmitting(true);
    try {
      await onCreatePlacement({
        shipment_id: shipmentId,
        order_id: selectedOrderId,
        wall_number: wall.wall_number,
        box_count: count,
      });
      toast.success(t("toast.placementCreated", { count, wall: wall.wall_number }));
      track("placement_created", { wall_number: wall.wall_number, box_count: count });
      setSelectedOrderId("");
      setBoxCount("");
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const count = parseInt(editBoxCount, 10);
    if (isNaN(count) || count < 1) {
      toast.error(t("wall.error.boxCount"));
      return;
    }

    const pw = wall.placements.find((p) => p.placement.id === id);
    if (!pw) return;

    const orderData = orders.find((o) => o.order.id === pw.order.id);
    const maxForOrder =
      (orderData?.remaining_boxes ?? 0) + pw.placement.box_count;
    const maxForWall = wall.remaining_capacity + pw.placement.box_count;
    const max = Math.min(maxForOrder, maxForWall);

    if (count > max) {
      toast.error(t("wall.error.maxBoxes", { max }));
      return;
    }

    setSubmitting(true);
    try {
      await onUpdatePlacement({ id, box_count: count });
      toast.success(t("toast.placementUpdated"));
      setEditingId(null);
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeletePlacement(id);
      toast.success(t("toast.placementDeleted"));
    } catch {
      // error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t("wall.title", { number: wall.wall_number })}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {t("wall.boxCount", { placed: wall.total_boxes, total: boxesPerWall })}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Existing placements */}
        {wall.placements.length > 0 && (
          <div className="grid gap-2">
            {wall.placements.map((pw) => {
              const isEditing = editingId === pw.placement.id;
              const isDone = pw.order.is_done;
              return (
                <div
                  key={pw.placement.id}
                  className={`flex items-center gap-2 rounded-md border p-2 ${isDone ? "opacity-50" : ""}`}
                >
                  <Badge variant="secondary" className="shrink-0">
                    #{pw.order.order_number}
                  </Badge>
                  {isEditing && isOperator ? (
                    <>
                      <Input
                        type="number"
                        min={1}
                        value={editBoxCount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditBoxCount(e.target.value)
                        }
                        className="h-8 w-20"
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => handleUpdate(pw.placement.id)}
                        disabled={submitting}
                      >
                        OK
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setEditingId(null)}
                      >
                        {t("common.cancel")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">
                        {pw.placement.box_count} {t("orders.boxes")}
                      </span>
                      {isReadOnly ? null : isDone ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => onUndoDone(pw.order.id)}
                        >
                          <Undo2 className="mr-1 h-3 w-3" />
                          {t("action.undo")}
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title={t("action.markDone")}
                            onClick={() => onMarkDone(pw.order.id)}
                          >
                            <CircleCheck className="h-3.5 w-3.5" />
                          </Button>
                          {isOperator && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                aria-label="Edit placement"
                                onClick={() => {
                                  setEditingId(pw.placement.id);
                                  setEditBoxCount(
                                    pw.placement.box_count.toString()
                                  );
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost-destructive"
                                className="h-7 w-7"
                                aria-label="Delete placement"
                                onClick={() => handleDelete(pw.placement.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add new placement (operator only) */}
        {isOperator &&
          !isReadOnly &&
          !wall.is_full &&
          availableOrders.length > 0 && (
            <>
              {wall.placements.length > 0 && <Separator />}
              <div className="grid gap-3">
                <Label>{t("wall.addOrder")}</Label>
                <Select
                  value={selectedOrderId}
                  onValueChange={(v) => {
                    setSelectedOrderId(v);
                    setBoxCount("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("wall.selectOrder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrders.map((o) => (
                      <SelectItem key={o.order.id} value={o.order.id}>
                        #{o.order.order_number} — {o.order.client_name} (
                        {o.remaining_boxes} {t("orders.remaining")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedOrderId && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={maxBoxes()}
                      placeholder={`${t("common.add")} (max ${maxBoxes()})`}
                      value={boxCount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBoxCount(e.target.value)
                      }
                      className="h-9"
                    />
                    <Button
                      onClick={handleAdd}
                      disabled={submitting}
                      className="shrink-0"
                    >
                      {submitting ? "..." : t("common.add")}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

        {/* Full wall message */}
        {wall.is_full && (
          <p className="text-muted-foreground text-center text-sm">
            {t("wall.full")}
          </p>
        )}

        {/* No available orders */}
        {!wall.is_full &&
          availableOrders.length === 0 &&
          wall.placements.length === 0 && (
            <p className="text-muted-foreground text-center text-sm">
              {t("wall.noOrders")}
            </p>
          )}
      </DialogContent>
    </Dialog>
  );
}
