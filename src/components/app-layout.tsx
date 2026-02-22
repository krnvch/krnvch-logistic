import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SummaryBar } from "@/components/summary-bar";
import { SearchInput } from "@/components/search-input";
import { OrderSidebar } from "@/components/order-sidebar";
import { TrailerMap } from "@/components/trailer-map";
import { WallPopover } from "@/components/wall-popover";
import { useSearch } from "@/hooks/use-search";
import { Flower2, LogOut, Menu, RotateCcw } from "lucide-react";
import type {
  OrderWithStatus,
  OrderInsert,
  OrderUpdate,
  WallData,
  PlacementInsert,
  PlacementUpdate,
} from "@/types";

interface AppLayoutProps {
  logout: () => Promise<void>;
  isOperator: boolean;
  orders: OrderWithStatus[];
  walls: WallData[];
  shipmentId: string;
  boxesPerWall: number;
  onCreateOrder: (data: OrderInsert) => Promise<unknown>;
  onUpdateOrder: (data: OrderUpdate & { id: string }) => Promise<unknown>;
  onDeleteOrder: (id: string) => Promise<unknown>;
  onCreatePlacement: (data: PlacementInsert) => Promise<unknown>;
  onUpdatePlacement: (
    data: PlacementUpdate & { id: string }
  ) => Promise<unknown>;
  onDeletePlacement: (id: string) => Promise<unknown>;
  onMarkDone: (orderId: string) => Promise<unknown>;
  onUndoDone: (orderId: string) => Promise<unknown>;
  onCompleteShipment: () => Promise<unknown>;
}

export function AppLayout({
  logout,
  isOperator,
  orders,
  walls,
  shipmentId,
  boxesPerWall,
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
  onCreatePlacement,
  onUpdatePlacement,
  onDeletePlacement,
  onMarkDone,
  onUndoDone,
  onCompleteShipment,
}: AppLayoutProps) {
  const [activeWall, setActiveWall] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const search = useSearch({ orders, walls });

  const activeWallData = activeWall
    ? (walls.find((w) => w.wall_number === activeWall) ?? null)
    : null;

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <Flower2 className="h-5 w-5 shrink-0" />
          <h1 className="text-lg font-semibold max-sm:hidden">Tulip</h1>
        </div>

        <div className="max-md:hidden">
          <SummaryBar orders={orders} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SearchInput
            value={search.query}
            onChange={search.setQuery}
            onClear={search.clearSearch}
            noResults={search.noResults}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOperator && (
                <DropdownMenuItem onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Завершить рейс
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile summary bar */}
      <div className="flex items-center justify-center border-b px-3 py-1.5 md:hidden">
        <SummaryBar orders={orders} />
      </div>

      {/* Main content: map + sidebar */}
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        {/* Map area */}
        <main className="flex-1 overflow-hidden bg-muted/30 max-md:min-h-0">
          <TrailerMap
            walls={walls}
            boxesPerWall={boxesPerWall}
            onWallClick={(n) => setActiveWall(n)}
            highlightedWalls={search.highlightedWalls}
            animatingWalls={search.animatingWalls}
            onAnimationEnd={search.onAnimationEnd}
            firstMatchedWall={search.firstMatchedWall}
          />
        </main>

        {/* Sidebar */}
        <aside className="w-full border-l bg-background max-md:h-[45%] max-md:shrink-0 max-md:border-l-0 max-md:border-t md:w-80 lg:w-96">
          <OrderSidebar
            orders={orders}
            shipmentId={shipmentId}
            isOperator={isOperator}
            onCreateOrder={onCreateOrder}
            onUpdateOrder={onUpdateOrder}
            onDeleteOrder={onDeleteOrder}
            onMarkDone={onMarkDone}
            onUndoDone={onUndoDone}
            matchedOrderIds={search.matchedOrderIds}
            onOrderTap={search.highlightOrder}
          />
        </aside>
      </div>

      {/* Wall popover */}
      <WallPopover
        open={activeWall !== null}
        onClose={() => setActiveWall(null)}
        wall={activeWallData}
        orders={orders}
        shipmentId={shipmentId}
        boxesPerWall={boxesPerWall}
        isOperator={isOperator}
        onCreatePlacement={onCreatePlacement}
        onUpdatePlacement={onUpdatePlacement}
        onDeletePlacement={onDeletePlacement}
        onMarkDone={onMarkDone}
        onUndoDone={onUndoDone}
      />

      {/* Complete shipment confirmation */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить рейс?</AlertDialogTitle>
            <AlertDialogDescription>
              Текущий рейс будет завершён. Все данные сохранятся, но вы
              перейдёте к созданию нового рейса.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onCompleteShipment();
                setConfirmReset(false);
              }}
            >
              Завершить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
