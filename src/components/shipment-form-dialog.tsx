import { useState } from "react";
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

interface ShipmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    trailer_walls: number;
    boxes_per_wall: number;
    created_by?: string | null;
  }) => Promise<unknown>;
  isCreating: boolean;
  userEmail?: string;
}

export function ShipmentFormDialog({
  open,
  onClose,
  onCreate,
  isCreating,
  userEmail,
}: ShipmentFormDialogProps) {
  const [name, setName] = useState("");
  const [walls, setWalls] = useState("30");
  const [boxesPerWall, setBoxesPerWall] = useState("24");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const wallCount = parseInt(walls, 10);
    const boxCount = parseInt(boxesPerWall, 10);

    if (!name.trim()) {
      toast.error("Введите название рейса");
      return;
    }
    if (wallCount < 1 || wallCount > 100) {
      toast.error("Количество стен: от 1 до 100");
      return;
    }
    if (boxCount < 1 || boxCount > 100) {
      toast.error("Коробок на стену: от 1 до 100");
      return;
    }

    try {
      await onCreate({
        name: name.trim(),
        trailer_walls: wallCount,
        boxes_per_wall: boxCount,
        created_by: userEmail ?? null,
      });
      toast.success("Рейс создан!");
      setName("");
      setWalls("30");
      setBoxesPerWall("24");
      onClose();
    } catch {
      toast.error("Не удалось создать рейс");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Новый рейс</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="shipment-name">Название</Label>
            <Input
              id="shipment-name"
              placeholder="Например: Рейс на Москву"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="shipment-walls">Стены</Label>
              <Input
                id="shipment-walls"
                type="number"
                min={1}
                max={100}
                value={walls}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWalls(e.target.value)
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipment-boxes">Коробок / стену</Label>
              <Input
                id="shipment-boxes"
                type="number"
                min={1}
                max={100}
                value={boxesPerWall}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBoxesPerWall(e.target.value)
                }
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? "Создаётся..." : "Создать рейс"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
