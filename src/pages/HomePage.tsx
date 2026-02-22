import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { ShipmentSetup } from "@/components/shipment-setup";
import { useShipment } from "@/hooks/use-shipment";
import { useOrders } from "@/hooks/use-orders";
import { usePlacements } from "@/hooks/use-placements";
import { useWallData } from "@/hooks/use-wall-data";
import { useRealtimeSync } from "@/hooks/use-realtime";
import { toast } from "sonner";

interface HomePageProps {
  logout: () => Promise<void>;
  isOperator: boolean;
}

export default function HomePage({ logout, isOperator }: HomePageProps) {
  const { shipment, isLoading, createShipment, isCreating, completeShipment } =
    useShipment();
  const { orders, createOrder, updateOrder, deleteOrder } = useOrders(
    shipment?.id
  );
  const { placements, createPlacement, updatePlacement, deletePlacement } =
    usePlacements(shipment?.id);

  // Realtime subscription
  useRealtimeSync(shipment?.id);

  // Compute wall data and order statuses
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
      toast.success("Заказ отмечен как готово");
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
      toast.success("Заказ возвращён в работу");
    },
    [updateOrder]
  );

  const handleCompleteShipment = useCallback(async () => {
    if (!shipment) return;
    await completeShipment(shipment.id);
  }, [shipment, completeShipment]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!shipment) {
    if (!isOperator) {
      return (
        <div className="flex min-h-dvh items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Ожидание рейса...</p>
            <p className="mt-1 text-sm">
              Оператор ещё не создал рейс. Попробуйте позже.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={logout}
            >
              Выйти
            </Button>
          </div>
        </div>
      );
    }
    return (
      <ShipmentSetup onCreate={createShipment} isCreating={isCreating} />
    );
  }

  return (
    <AppLayout
      logout={logout}
      isOperator={isOperator}
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
    />
  );
}
