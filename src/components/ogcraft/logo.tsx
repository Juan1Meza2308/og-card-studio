import { Aperture } from "lucide-react";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold text-foreground ${className ?? ""}`}
    >
      <span className="grid size-8 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary shadow-glow">
        <Aperture className="size-4" />
      </span>
      {!compact && <span className="text-[15px]">OGCraft</span>}
    </span>
  );
}
