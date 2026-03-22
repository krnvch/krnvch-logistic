import { useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { useShipment } from "@/hooks/use-shipment";
import { useOrders } from "@/hooks/use-orders";
import { usePlacements } from "@/hooks/use-placements";
import { useWallData } from "@/hooks/use-wall-data";
import { useRealtimeSync } from "@/hooks/use-realtime";
import { useLastShipment } from "@/hooks/use-last-shipment";
import { toast } from "sonner";
import i18n from "@/lib/i18n";
import { track } from "@/lib/analytics";

interface ShipmentDetailPageProps {
  logout: () => Promise<void>;
  isOperator: boolean;
  userInitials: string;
}

export default function ShipmentDetailPage({
  logout,
  isOperator,
  userInitials,
}: ShipmentDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lastShipment = useLastShipment();

  const {
    shipment,
    isLoading,
    completeShipment,
    reopenShipment,
    renameShipment,
  } = useShipment(id);
  const { orders, createOrder, updateOrder, deleteOrder } = useOrders(id);
  const { placements, createPlacement, updatePlacement, deletePlacement } =
    usePlacements(id);

  useRealtimeSync(id);

  // Save last visited shipment
  useEffect(() => {
    if (id) lastShipment.set(id);
  }, [id, lastShipment]);

  // Redirect if shipment not found (deleted or invalid)
  useEffect(() => {
    if (!isLoading && !shipment && id) {
      toast.error(i18n.t("toast.shipmentNotFound"));
      lastShipment.clear();
      navigate("/", { replace: true });
    }
  }, [isLoading, shipment, id, navigate, lastShipment]);

  const isReadOnly = shipment?.status === "completed";

  const { walls, ordersWithStatus } = useWallData({
    orders,
    placements,
    trailerWalls: shipment?.trailer_walls ?? 30,
    boxesPerWall: shipment?.boxes_per_wall ?? 24,
  });

  const markDone = useCallback(
    async (orderId: string) => {
      await updateOrder({
        id: orderId,
        is_done: true,
        done_at: new Date().toISOString(),
      });
      toast.success(i18n.t("toast.orderMarkedDone"));
      track("order_marked_done", { order_id: orderId });
    },
    [updateOrder]
  );

  const undoDone = useCallback(
    async (orderId: string) => {
      await updateOrder({
        id: orderId,
        is_done: false,
        done_at: null,
      });
      toast.success(i18n.t("toast.orderUndone"));
      track("order_undone", { order_id: orderId });
    },
    [updateOrder]
  );

  const handleCompleteShipment = useCallback(async () => {
    if (!shipment) return;
    await completeShipment(shipment.id);
    track("shipment_completed", { shipment_id: shipment.id });
  }, [shipment, completeShipment]);

  const handleReopenShipment = useCallback(async () => {
    if (!shipment) return;
    await reopenShipment(shipment.id);
  }, [shipment, reopenShipment]);

  const handleRenameShipment = useCallback(
    async (name: string) => {
      if (!shipment) return;
      await renameShipment({ id: shipment.id, name });
    },
    [shipment, renameShipment]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <AppLayout
      logout={logout}
      isOperator={isOperator}
      isReadOnly={isReadOnly}
      userInitials={userInitials}
      shipmentName={shipment.name}
      orders={ordersWithStatus}
      walls={walls}
      shipmentId={shipment.id}
      boxesPerWall={shipment.boxes_per_wall}
      onCreateOrder={createOrder}
      onUpdateOrder={updateOrder}
      onDeleteOrder={deleteOrder}
      onCreatePlacement={createPlacement}
      onUpdatePlacement={updatePlacement}
      onDeletePlacement={deletePlacement}
      onMarkDone={markDone}
      onUndoDone={undoDone}
      onCompleteShipment={handleCompleteShipment}
      onReopenShipment={handleReopenShipment}
      onRenameShipment={handleRenameShipment}
    />
  );
}
