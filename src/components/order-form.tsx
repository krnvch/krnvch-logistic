import { useState, useEffect } from "react";
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
      toast.error("Укажите количество коробок (больше 0)");
      return;
    }

    if (boxes < minBoxCount) {
      toast.error(`Минимум ${minBoxCount} коробок (уже размещено)`);
      return;
    }

    // Check unique order number (skip current order on edit)
    const isDuplicate = existingNumbers
      .filter((n) => (isEdit ? n !== editOrder.order_number : true))
      .includes(orderNumber.trim());

    if (isDuplicate) {
      toast.error("Заказ с таким номером уже существует");
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
        toast.success("Заказ обновлён");
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
        toast.success("Заказ создан");
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
            {isEdit ? "Редактировать заказ" : "Новый заказ"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="order-number">Номер заказа *</Label>
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
              <Label htmlFor="box-count">Коробок *</Label>
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
            <Label htmlFor="client-name">Клиент *</Label>
            <Input
              id="client-name"
              placeholder="Иванов"
              value={clientName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setClientName(e.target.value)
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              placeholder="Описание товара"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="item-count">Количество</Label>
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
              <Label htmlFor="pickup-time">Время выдачи</Label>
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
            <Label htmlFor="priority">Приоритет</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as OrderPriority)}
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Обычный</SelectItem>
                <SelectItem value="urgent">Срочный</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Сохранение..."
              : isEdit
                ? "Сохранить"
                : "Добавить заказ"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
