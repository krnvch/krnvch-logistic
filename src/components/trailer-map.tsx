import { ScrollArea } from "@/components/ui/scroll-area";
import { WallCell } from "@/components/wall-cell";
import type { WallData } from "@/types";

interface TrailerMapProps {
  walls: WallData[];
  boxesPerWall: number;
  onWallClick: (wallNumber: number) => void;
  highlightedWalls?: Set<number>;
  animatingWalls?: Set<number>;
  onAnimationEnd?: (wallNumber: number) => void;
  firstMatchedWall?: number | null;
}

export function TrailerMap({
  walls,
  boxesPerWall,
  onWallClick,
  highlightedWalls,
  animatingWalls,
  onAnimationEnd,
  firstMatchedWall,
}: TrailerMapProps) {
  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-1.5 p-4">
        {/* Cab label */}
        <div className="text-muted-foreground mb-1 text-center text-xs font-medium tracking-wider uppercase">
          Кабина (дальняя стенка)
        </div>

        {/* Walls 1..N */}
        {walls.map((wall) => (
          <WallCell
            key={wall.wall_number}
            wall={wall}
            boxesPerWall={boxesPerWall}
            onClick={() => onWallClick(wall.wall_number)}
            highlighted={highlightedWalls?.has(wall.wall_number)}
            animating={animatingWalls?.has(wall.wall_number)}
            onAnimationEnd={() => onAnimationEnd?.(wall.wall_number)}
            scrollIntoView={firstMatchedWall === wall.wall_number}
          />
        ))}

        {/* Doors label */}
        <div className="text-muted-foreground mt-1 text-center text-xs font-medium tracking-wider uppercase">
          Двери
        </div>
      </div>
    </ScrollArea>
  );
}
