import { useState } from "react";
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
import { track } from "@/lib/analytics";

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
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [walls, setWalls] = useState("30");
  const [boxesPerWall, setBoxesPerWall] = useState("24");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const wallCount = parseInt(walls, 10);
    const boxCount = parseInt(boxesPerWall, 10);

    if (!name.trim()) {
      toast.error(t("shipments.form.error.name"));
      return;
    }
    if (wallCount < 1 || wallCount > 100) {
      toast.error(t("shipments.form.error.walls"));
      return;
    }
    if (boxCount < 1 || boxCount > 100) {
      toast.error(t("shipments.form.error.boxes"));
      return;
    }

    try {
      await onCreate({
        name: name.trim(),
        trailer_walls: wallCount,
        boxes_per_wall: boxCount,
        created_by: userEmail ?? null,
      });
      toast.success(t("toast.shipmentCreated"));
      track("shipment_created", { name: name.trim(), trailer_walls: wallCount, boxes_per_wall: boxCount });
      setName("");
      setWalls("30");
      setBoxesPerWall("24");
      onClose();
    } catch {
      toast.error(t("toast.shipmentCreateError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shipments.form.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="shipment-name">{t("shipments.form.name")}</Label>
            <Input
              id="shipment-name"
              placeholder={t("shipments.form.namePlaceholder")}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="shipment-walls">{t("shipments.form.walls")}</Label>
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
              <Label htmlFor="shipment-boxes">{t("shipments.form.boxesPerWall")}</Label>
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
            {isCreating ? t("shipments.form.creating") : t("shipments.form.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
