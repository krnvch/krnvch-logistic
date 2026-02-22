import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Plus } from "lucide-react";
import { OrderCard } from "@/components/order-card";
import { OrderForm } from "@/components/order-form";
import type { Order, OrderWithStatus, OrderInsert, OrderUpdate } from "@/types";

interface OrderSidebarProps {
  orders: OrderWithStatus[];
  shipmentId: string;
  isOperator: boolean;
  onCreateOrder: (data: OrderInsert) => Promise<unknown>;
  onUpdateOrder: (data: OrderUpdate & { id: string }) => Promise<unknown>;
  onDeleteOrder: (id: string) => Promise<unknown>;
  onMarkDone: (orderId: string) => Promise<unknown>;
  onUndoDone: (orderId: string) => Promise<unknown>;
  matchedOrderIds?: Set<string>;
  onOrderTap?: (orderId: string) => void;
}

export function OrderSidebar({
  orders,
  shipmentId,
  isOperator,
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
  onMarkDone,
  onUndoDone,
  matchedOrderIds,
  onOrderTap,
}: OrderSidebarProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<OrderWithStatus | null>(null);
  const [doneOrder, setDoneOrder] = useState<OrderWithStatus | null>(null);

  const existingNumbers = orders.map((o) => o.order.order_number);

  const handleEdit = (data: OrderWithStatus) => {
    setEditOrder(data.order);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditOrder(null);
  };

  const handleFormSubmit = async (
    data: OrderInsert | (OrderUpdate & { id: string })
  ) => {
    if ("id" in data && typeof data.id === "string") {
      await onUpdateOrder(data as OrderUpdate & { id: string });
    } else {
      await onCreateOrder(data as OrderInsert);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOrder) return;
    await onDeleteOrder(deleteOrder.order.id);
    setDeleteOrder(null);
  };

  const handleDoneConfirm = async () => {
    if (!doneOrder) return;
    await onMarkDone(doneOrder.order.id);
    setDoneOrder(null);
  };

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="font-semibold">Заказы</h2>
          {isOperator && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Добавить
            </Button>
          )}
        </div>

        {/* Order list */}
        <ScrollArea className="flex-1">
          <div className="grid gap-2 p-3">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Нет заказов. Добавьте первый заказ.
              </div>
            ) : (
              orders.map((data) => (
                <OrderCard
                  key={data.order.id}
                  data={data}
                  isOperator={isOperator}
                  onEdit={() => handleEdit(data)}
                  onDelete={() => setDeleteOrder(data)}
                  onMarkDone={() => setDoneOrder(data)}
                  onUndoDone={() => onUndoDone(data.order.id)}
                  onTap={() => onOrderTap?.(data.order.id)}
                  highlighted={matchedOrderIds?.has(data.order.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Order form dialog */}
      <OrderForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        shipmentId={shipmentId}
        editOrder={editOrder}
        existingNumbers={existingNumbers}
        minBoxCount={editOrder ? 1 : 1}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteOrder}
        onOpenChange={(v) => !v && setDeleteOrder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
            <AlertDialogDescription>
              Заказ #{deleteOrder?.order.order_number} будет удалён.
              {deleteOrder && deleteOrder.placed_boxes > 0 && (
                <>
                  {" "}
                  Это также удалит {deleteOrder.placed_boxes} размещённых
                  коробок с карты.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Done confirmation */}
      <AlertDialog
        open={!!doneOrder}
        onOpenChange={(v) => !v && setDoneOrder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отметить как готово?</AlertDialogTitle>
            <AlertDialogDescription>
              Заказ #{doneOrder?.order.order_number} ({doneOrder?.order.client_name}) будет
              отмечен как выданный.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDoneConfirm}>
              Готово
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
