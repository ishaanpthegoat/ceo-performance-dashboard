/**
 * Shared chart furniture. Every chart in the app draws its ink from here so the
 * legend swatches, tooltips and axis treatment stay identical across forms.
 *
 * Two rules from the data-viz spec are enforced structurally rather than by
 * memory:
 *   · Text never wears the series colour — identity comes from a swatch beside
 *     the label, and the label itself uses ink tokens.
 *   · A legend is present for two or more series; a single-series chart gets
 *     none, because the title already names what is plotted.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Categorical slots, in the fixed validated order. Never cycle past slot 8. */
export const SERIES = [
  "var(--color-s1)",
  "var(--color-s2)",
  "var(--color-s3)",
  "var(--color-s4)",
  "var(--color-s5)",
  "var(--color-s6)",
  "var(--color-s7)",
  "var(--color-s8)",
] as const;

/**
 * Capital allocation uses slots 1–4 in stacking order, bottom to top. The order
 * is the CVD-safety mechanism — this exact sequence was run through the palette
 * validator and clears every adjacent gate in both modes. Do not reorder to
 * suit a narrative.
 */
export const ALLOCATION = [
  { key: "capex", label: "Capex", color: SERIES[0] },
  { key: "acquisitions", label: "Acquisitions", color: SERIES[1] },
  { key: "buybacks", label: "Buybacks", color: SERIES[2] },
  { key: "dividends", label: "Dividends", color: SERIES[3] },
] as const;

export type AllocationKey = (typeof ALLOCATION)[number]["key"];

export const AXIS = {
  stroke: "var(--color-axis)",
  tick: { fill: "var(--color-muted)", fontSize: 11 },
} as const;

/** 2px surface-coloured separator between touching stacked segments. */
export const STACK_GAP = { stroke: "var(--color-surface)", strokeWidth: 2 } as const;

export function Legend({
  items,
  className,
}: {
  items: { label: string; color: string; kind?: "fill" | "line" | "dash" }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-xs text-ink-2">
          {i.kind === "line" || i.kind === "dash" ? (
            <span
              aria-hidden
              className="h-0.5 w-4 shrink-0 rounded-full"
              style={
                i.kind === "dash"
                  ? {
                      backgroundImage: `repeating-linear-gradient(90deg, ${i.color} 0 4px, transparent 4px 7px)`,
                    }
                  : { background: i.color }
              }
            />
          ) : (
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: i.color }}
            />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function TooltipShell({
  title,
  children,
}: {
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-[9rem] rounded-lg bg-surface/95 p-2.5 shadow-xl backdrop-blur-sm hairline">
      {title && (
        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted">{title}</p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
  kind = "fill",
}: {
  color?: string;
  label: string;
  value: ReactNode;
  kind?: "fill" | "line";
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="flex items-center gap-1.5 text-ink-2">
        {color && (
          <span
            aria-hidden
            className={cn("shrink-0", kind === "line" ? "h-0.5 w-3 rounded-full" : "size-2.5 rounded-[3px]")}
            style={{ background: color }}
          />
        )}
        {label}
      </span>
      <span className="font-medium tnum text-ink">{value}</span>
    </div>
  );
}

/** Shown wherever a chart has no data to draw, instead of an empty axis box. */
export function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-full min-h-40 place-items-center rounded-xl bg-surface-2/50 px-6 text-center">
      <p className="max-w-sm text-sm text-muted">{children}</p>
    </div>
  );
}
