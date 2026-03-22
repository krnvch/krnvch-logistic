import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, OrderInsert, OrderUpdate, OrderPriority } from "@/types";
import { track } from "@/lib/analytics";

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: OrderInsert | (OrderUpdate & { id: string })
  ) => Promise<unknown>;
  shipmentId: string;
  editOrder?: Order | null;
  existingNumbers?: string[];
  minBoxCount?: number;
}

export function OrderForm({
  open,
  onClose,
  onSubmit,
  shipmentId,
  editOrder,
  existingNumbers = [],
  minBoxCount = 1,
}: OrderFormProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [itemCount, setItemCount] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("normal");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const isEdit = !!editOrder;

  useEffect(() => {
    if (open && editOrder) {
      setOrderNumber(editOrder.order_number);
      setClientName(editOrder.client_name);
      setDescription(editOrder.description ?? "");
      setItemCount(editOrder.item_count?.toString() ?? "");
      setBoxCount(editOrder.box_count.toString());
      setPickupTime(editOrder.pickup_time ?? "");
      setPriority((editOrder.priority as OrderPriority) ?? "normal");
    } else if (open) {
      setOrderNumber("");
      setClientName("");
      setDescription("");
      setItemCount("");
      setBoxCount("");
      setPickupTime("");
      setPriority("normal");
    }
  }, [open, editOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const boxes = parseInt(boxCount, 10);
    if (isNaN(boxes) || boxes < 1) {
      toast.error(t("orders.form.error.boxCount"));
      return;
    }

    if (boxes < minBoxCount) {
      toast.error(t("orders.form.error.minBoxCount", { min: minBoxCount }));
      return;
    }

    // Check unique order number (skip current order on edit)
    const isDuplicate = existingNumbers
      .filter((n) => (isEdit ? n !== editOrder.order_number : true))
      .includes(orderNumber.trim());

    if (isDuplicate) {
      toast.error(t("orders.form.error.duplicate"));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await onSubmit({
          id: editOrder.id,
          order_number: orderNumber.trim(),
          client_name: clientName.trim(),
          description: description.trim() || null,
          item_count: itemCount ? parseInt(itemCount, 10) : null,
          box_count: boxes,
          pickup_time: pickupTime.trim() || null,
          priority,
        });
        toast.success(t("toast.orderUpdated"));
        track("order_updated", { order_id: editOrder.id, priority, box_count: boxes });
      } else {
        await onSubmit({
          shipment_id: shipmentId,
          order_number: orderNumber.trim(),
          client_name: clientName.trim(),
          description: description.trim() || null,
          item_count: itemCount ? parseInt(itemCount, 10) : null,
          box_count: boxes,
          pickup_time: pickupTime.trim() || null,
          priority,
        });
        toast.success(t("toast.orderCreated"));
        track("order_created", { priority, box_count: boxes });
      }
      onClose();
    } catch {
      // Error toast handled by mutation hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("orders.form.editTitle") : t("orders.form.createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="order-number">{t("orders.form.orderNumber")} *</Label>
              <Input
                id="order-number"
                placeholder="123"
                value={orderNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOrderNumber(e.target.value)
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="box-count">{t("orders.form.boxCount")} *</Label>
              <Input
                id="box-count"
                type="number"
                min={minBoxCount}
                placeholder="24"
                value={boxCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBoxCount(e.target.value)
                }
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-name">{t("orders.form.client")} *</Label>
            <Input
              id="client-name"
              placeholder="Smith"
              value={clientName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setClientName(e.target.value)
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("orders.form.description")}</Label>
            <Input
              id="description"
              placeholder={t("orders.form.descriptionPlaceholder")}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="item-count">{t("orders.form.itemCount")}</Label>
              <Input
                id="item-count"
                type="number"
                min={0}
                placeholder="1000"
                value={itemCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setItemCount(e.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pickup-time">{t("orders.form.pickupTime")}</Label>
              <Input
                id="pickup-time"
                placeholder="10:00"
                value={pickupTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPickupTime(e.target.value)
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">{t("orders.form.priority")}</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as OrderPriority)}
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t("orders.priority.normal")}</SelectItem>
                <SelectItem value="urgent">{t("orders.priority.urgent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? t("common.saving")
              : isEdit
                ? t("common.save")
                : t("orders.form.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
