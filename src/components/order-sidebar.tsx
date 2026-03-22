import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  isReadOnly?: boolean;
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
  isReadOnly = false,
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
  onMarkDone,
  onUndoDone,
  matchedOrderIds,
  onOrderTap,
}: OrderSidebarProps) {
  const { t } = useTranslation();
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
          <h2 className="font-heading font-semibold">{t("orders.title")}</h2>
          {isOperator && !isReadOnly && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("common.add")}
            </Button>
          )}
        </div>

        {/* Order list */}
        <ScrollArea className="flex-1">
          <div className="grid gap-2 p-3">
            {orders.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center text-sm">
                {t("orders.empty")}
              </div>
            ) : (
              orders.map((data) => (
                <OrderCard
                  key={data.order.id}
                  data={data}
                  isOperator={isOperator}
                  isReadOnly={isReadOnly}
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
            <AlertDialogTitle>{t("dialog.deleteOrder.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.deleteOrder.description", { number: deleteOrder?.order.order_number })}
              {deleteOrder && deleteOrder.placed_boxes > 0 && (
                <>
                  {t("dialog.deleteOrder.placementsWarning", { count: deleteOrder.placed_boxes })}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t("common.delete")}
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
            <AlertDialogTitle>{t("dialog.markDone.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.markDone.description", { number: doneOrder?.order.order_number, client: doneOrder?.order.client_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDoneConfirm}>
              {t("action.markDone")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
