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
import { Badge } from "@/components/ui/badge";
import { SummaryBar } from "@/components/summary-bar";
import { SearchInput } from "@/components/search-input";
import { OrderSidebar } from "@/components/order-sidebar";
import { TrailerMap } from "@/components/trailer-map";
import { WallPopover } from "@/components/wall-popover";
import { useSearch } from "@/hooks/use-search";
import { RenameShipmentDialog } from "@/components/rename-shipment-dialog";
import { Package, LogOut, Menu, RotateCcw, List, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  isReadOnly?: boolean;
  shipmentName?: string;
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
  onReopenShipment?: () => Promise<unknown>;
  onRenameShipment?: (name: string) => Promise<unknown>;
}

export function AppLayout({
  logout,
  isOperator,
  isReadOnly = false,
  shipmentName,
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
  onReopenShipment,
  onRenameShipment,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const [activeWall, setActiveWall] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const search = useSearch({ orders, walls });

  const activeWallData = activeWall
    ? (walls.find((w) => w.wall_number === activeWall) ?? null)
    : null;

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 shrink-0" />
          <h1 className="text-lg font-semibold max-sm:hidden">
            {shipmentName ?? "krnvch"}
          </h1>
          {isReadOnly && (
            <Badge variant="secondary" className="text-xs">
              Завершён
            </Badge>
          )}
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
              <DropdownMenuItem
                onClick={() => navigate("/", { state: { skipRedirect: true } })}
              >
                <List className="mr-2 h-4 w-4" />
                Все рейсы
              </DropdownMenuItem>
              {isOperator && onRenameShipment && (
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Переименовать
                </DropdownMenuItem>
              )}
              {isOperator && !isReadOnly && (
                <DropdownMenuItem onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Завершить рейс
                </DropdownMenuItem>
              )}
              {isOperator && isReadOnly && onReopenShipment && (
                <DropdownMenuItem onClick={() => onReopenShipment()}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Возобновить рейс
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
        <main className="bg-muted/30 flex-1 overflow-hidden max-md:min-h-0">
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
        <aside className="bg-background w-full border-l max-md:h-[45%] max-md:shrink-0 max-md:border-t max-md:border-l-0 md:w-80 lg:w-96">
          <OrderSidebar
            orders={orders}
            shipmentId={shipmentId}
            isOperator={isOperator}
            isReadOnly={isReadOnly}
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
        isReadOnly={isReadOnly}
        onCreatePlacement={onCreatePlacement}
        onUpdatePlacement={onUpdatePlacement}
        onDeletePlacement={onDeletePlacement}
        onMarkDone={onMarkDone}
        onUndoDone={onUndoDone}
      />

      {/* Rename shipment dialog */}
      {onRenameShipment && (
        <RenameShipmentDialog
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
          currentName={shipmentName ?? ""}
          onRename={onRenameShipment}
        />
      )}

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
