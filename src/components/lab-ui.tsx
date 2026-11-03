import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function Control({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">
          {Number.isInteger(step) ? value : value.toFixed(1)}
          {unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

export function Readout({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono text-lg tabular-nums",
          tone === "good" && "text-status-live",
          tone === "warn" && "text-signal",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const idx = options.findIndex((o) => o.value === value);
  return (
    <div className="relative grid rounded-md bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <div
        className="absolute inset-y-1 rounded bg-card shadow-soft transition-transform duration-300 ease-smooth"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${idx * 100}%)`, left: "0.25rem" }}
      />
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative z-10 py-1.5 text-sm transition-colors",
            o.value === value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stage({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-stage text-stage-foreground">
      <div className="pointer-events-none absolute inset-0 grid-bench opacity-40" />
      <div className="relative">{children}</div>
      {caption && (
        <div className="absolute bottom-3 left-4 font-mono text-[11px] tracking-wide text-stage-foreground/60">{caption}</div>
      )}
    </div>
  );
}
