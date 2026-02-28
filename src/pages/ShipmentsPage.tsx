import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Plus,
  Search,
  ArrowUpDown,
  LogOut,
  Menu,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  Pencil,
  User,
} from "lucide-react";
import { useShipments } from "@/hooks/use-shipment";
import { useShipmentProgress } from "@/hooks/use-shipment-progress";
import { useRealtimeShipments } from "@/hooks/use-realtime";
import { useLastShipment } from "@/hooks/use-last-shipment";
import { ShipmentFormDialog } from "@/components/shipment-form-dialog";
import { RenameShipmentDialog } from "@/components/rename-shipment-dialog";
import type { Shipment, ShipmentFilter, ShipmentsSort } from "@/types";

interface ShipmentsPageProps {
  logout: () => Promise<void>;
  isOperator: boolean;
  userEmail?: string;
}

export default function ShipmentsPage({
  logout,
  isOperator,
  userEmail,
}: ShipmentsPageProps) {
  const navigate = useNavigate();
  const {
    shipments,
    isLoading,
    createShipment,
    isCreating,
    deleteShipment,
    reopenShipment,
    renameShipment,
  } = useShipments();

  useRealtimeShipments();

  const location = useLocation();
  const skipRedirect =
    (location.state as { skipRedirect?: boolean })?.skipRedirect === true;
  const lastShipment = useLastShipment();

  // Quick entrance: redirect to last visited shipment (skip if user explicitly navigated here)
  const redirectChecked = useRef(false);
  useEffect(() => {
    if (isLoading || redirectChecked.current) return;
    redirectChecked.current = true;

    if (skipRedirect) return;

    const lastId = lastShipment.get();
    if (!lastId) return;

    const exists = shipments.some((s) => s.id === lastId);
    if (exists) {
      navigate(`/shipments/${lastId}`, { replace: true });
    } else {
      lastShipment.clear();
    }
  }, [isLoading, skipRedirect, shipments, lastShipment, navigate]);

  const shipmentIds = useMemo(() => shipments.map((s) => s.id), [shipments]);
  const { data: progressMap } = useShipmentProgress(shipmentIds);

  const [filter, setFilter] = useState<ShipmentFilter>("all");
  const [sort, setSort] = useState<ShipmentsSort>({
    column: "created_at",
    direction: "desc",
  });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Shipment | null>(null);
  const [renameTarget, setRenameTarget] = useState<Shipment | null>(null);

  const activeCount = shipments.filter((s) => s.status === "active").length;
  const completedCount = shipments.filter(
    (s) => s.status === "completed"
  ).length;

  const filtered = useMemo(() => {
    let result = shipments;

    if (filter === "active")
      result = result.filter((s) => s.status === "active");
    if (filter === "completed")
      result = result.filter((s) => s.status === "completed");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const col = sort.column;

      const va = a[col] ?? "";
      const vb = b[col] ?? "";

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return result;
  }, [shipments, filter, search, sort]);

  const toggleSort = (column: ShipmentsSort["column"]) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" }
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteShipment(deleteTarget.id);
    lastShipment.clear();
    setDeleteTarget(null);
  };

  const handleReopen = async (id: string) => {
    await reopenShipment(id);
  };

  const handleCreate = async (data: {
    name: string;
    trailer_walls: number;
    boxes_per_wall: number;
    created_by?: string | null;
  }) => {
    const result = await createShipment(data);
    navigate(`/shipments/${result.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 shrink-0" />
          <h1 className="text-lg font-semibold">krnvch</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isOperator && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Новый рейс
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl flex-1 p-4">
        {/* Filter tabs + search */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <FilterTab
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="Все"
              count={shipments.length}
            />
            <FilterTab
              active={filter === "active"}
              onClick={() => setFilter("active")}
              label="Активные"
              count={activeCount}
            />
            <FilterTab
              active={filter === "completed"}
              onClick={() => setFilter("completed")}
              label="Завершённые"
              count={completedCount}
            />
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            {shipments.length === 0
              ? "Нет рейсов. Создайте первый рейс."
              : "Ничего не найдено."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton
                      label="Название"
                      active={sort.column === "name"}
                      direction={sort.direction}
                      onClick={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <SortButton
                      label="Статус"
                      active={sort.column === "status"}
                      direction={sort.direction}
                      onClick={() => toggleSort("status")}
                    />
                  </TableHead>
                  <TableHead className="w-[160px]">Прогресс</TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton
                      label="Создан"
                      active={sort.column === "created_at"}
                      direction={sort.direction}
                      onClick={() => toggleSort("created_at")}
                    />
                  </TableHead>
                  <TableHead className="w-[150px] max-sm:hidden">
                    <SortButton
                      label="Автор"
                      active={sort.column === "created_by"}
                      direction={sort.direction}
                      onClick={() => toggleSort("created_by")}
                    />
                  </TableHead>
                  {isOperator && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const progress = progressMap?.[s.id];
                  const pct =
                    progress && progress.totalOrders > 0
                      ? Math.round(
                          (progress.doneOrders / progress.totalOrders) * 100
                        )
                      : 0;

                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/shipments/${s.id}`)}
                    >
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "active" ? "default" : "secondary"
                          }
                        >
                          {s.status === "active" ? "Активный" : "Завершён"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {progress && progress.totalOrders > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-muted-foreground w-8 text-right text-xs">
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.created_at).toLocaleDateString("ru")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-sm:hidden">
                        {s.created_by ?? "—"}
                      </TableCell>
                      {isOperator && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameTarget(s);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Переименовать
                              </DropdownMenuItem>
                              {s.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReopen(s.id);
                                  }}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Возобновить
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(s);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create shipment dialog */}
      <ShipmentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        isCreating={isCreating}
        userEmail={userEmail}
      />

      {/* Rename dialog */}
      <RenameShipmentDialog
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        currentName={renameTarget?.name ?? ""}
        onRename={(name) => renameShipment({ id: renameTarget!.id, name })}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить рейс?</AlertDialogTitle>
            <AlertDialogDescription>
              Рейс &quot;{deleteTarget?.name}&quot; и все его данные будут
              удалены безвозвратно.
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
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-xs ${
          active ? "bg-primary-foreground/20" : "bg-background"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${active ? "text-foreground" : "text-muted-foreground/50"}`}
      />
      {active && (
        <span className="text-muted-foreground text-[10px]">
          {direction === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}
