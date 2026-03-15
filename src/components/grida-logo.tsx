import { cn } from "@/lib/utils";

interface GridaLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

function ScopedG({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Grida"
    >
      <rect x="0" y="0" width="22" height="6" fill="currentColor" />
      <rect x="0" y="0" width="6" height="22" fill="currentColor" />
      <rect x="42" y="58" width="22" height="6" fill="currentColor" />
      <rect x="58" y="42" width="6" height="22" fill="currentColor" />
      <rect x="15" y="14" width="34" height="6" fill="currentColor" />
      <rect x="15" y="14" width="6" height="36" fill="currentColor" />
      <rect x="15" y="44" width="34" height="6" fill="currentColor" />
      <rect x="43" y="31" width="6" height="19" fill="currentColor" />
      <rect x="30" y="31" width="19" height="6" fill="currentColor" />
    </svg>
  );
}

export function GridaLogo({
  size = 32,
  showWordmark = true,
  className,
}: GridaLogoProps) {
  return (
    <div className={cn("flex items-center gap-[3px]", className)}>
      <ScopedG size={size} />
      {showWordmark && (
        <span
          className="font-heading text-lg font-medium"
          style={{ transform: "translateY(4px)" }}
        >
          Grida
        </span>
      )}
    </div>
  );
}
