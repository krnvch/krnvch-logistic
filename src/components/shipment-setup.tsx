import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flower2, Truck } from "lucide-react";
import { toast } from "sonner";

interface ShipmentSetupProps {
  onCreate: (data: {
    name: string;
    trailer_walls: number;
    boxes_per_wall: number;
  }) => Promise<unknown>;
  isCreating: boolean;
}

export function ShipmentSetup({ onCreate, isCreating }: ShipmentSetupProps) {
  const [name, setName] = useState("");
  const [walls, setWalls] = useState("30");
  const [boxesPerWall, setBoxesPerWall] = useState("24");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const wallCount = parseInt(walls, 10);
    const boxCount = parseInt(boxesPerWall, 10);

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
        name: name || undefined!,
        trailer_walls: wallCount,
        boxes_per_wall: boxCount,
      });
      toast.success("Рейс создан!");
    } catch {
      toast.error("Не удалось создать рейс");
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Flower2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Новый рейс</CardTitle>
          <CardDescription>
            Настройте трейлер перед загрузкой
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название (необязательно)</Label>
              <Input
                id="name"
                placeholder="Например: Рейс на Москву"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="walls">Стены</Label>
                <Input
                  id="walls"
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
                <Label htmlFor="boxes">Коробок / стену</Label>
                <Input
                  id="boxes"
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
              <Truck className="mr-2 h-4 w-4" />
              {isCreating ? "Создаётся..." : "Создать рейс"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
