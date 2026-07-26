/**
 * Stat tile, to the data-viz contract: label (sentence case, no colon), value,
 * optional delta signed against a named period, optional sparkline.
 *
 * Large values keep the font's proportional figures — `tabular-nums` gives every
 * digit the width of a zero, which makes a display-size number look loose.
 */
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedTooltip, NumberTicker } from "@/components/ui";

export function StatTile({
  label,
  value,
  /** Pass a number to animate it; pass a node to render as-is. */
  animate,
  format,
  delta,
  deltaLabel,
  /** Higher is better? Flips the delta colour. */
  upIsGood = true,
  note,
  spark,
  className,
  size = "md",
}: {
  label: string;
  value?: ReactNode;
  animate?: number;
  format?: (n: number) => string;
  delta?: number | null;
  deltaLabel?: string;
  upIsGood?: boolean;
  note?: string;
  spark?: number[];
  className?: string;
  size?: "md" | "lg" | "hero";
}) {
  const good = delta != null && (upIsGood ? delta > 0 : delta < 0);
  const sizes = {
    md: "text-2xl",
    lg: "text-3xl sm:text-4xl",
    hero: "text-4xl sm:text-5xl lg:text-6xl",
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5">
        <p className="truncate text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          {label}
        </p>
        {note && (
          <AnimatedTooltip content={note}>
            <span
              tabIndex={0}
              className="grid size-3.5 shrink-0 cursor-help place-items-center rounded-full text-[9px] font-bold text-muted hairline"
              aria-label={note}
            >
              i
            </span>
          </AnimatedTooltip>
        )}
      </div>

      <p className={cn("mt-1.5 font-semibold tracking-tight text-ink", sizes[size])}>
        {animate != null ? <NumberTicker value={animate} format={format} /> : value}
      </p>

      {(delta != null || deltaLabel) && (
        <p className="mt-1 flex items-center gap-1 text-xs">
          {delta != null && (
            <>
              {/* Icon + label, so direction never rides on colour alone. */}
              {delta > 0 ? (
                <ArrowUpRight className="size-3.5" style={{ color: good ? "var(--color-good)" : "var(--color-critical)" }} />
              ) : (
                <ArrowDownRight className="size-3.5" style={{ color: good ? "var(--color-good)" : "var(--color-critical)" }} />
              )}
              <span
                className="font-medium tnum"
                style={{ color: good ? "var(--color-good)" : "var(--color-critical)" }}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)}%
              </span>
            </>
          )}
          {deltaLabel && <span className="text-muted">{deltaLabel}</span>}
        </p>
      )}

      {spark && spark.length > 1 && <Sparkline values={spark} />}
    </div>
  );
}

/** 12-point sparkline: de-emphasised line, current point in the accent. */
function Sparkline({ values }: { values: number[] }) {
  const pts = values.slice(-12);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const w = 88;
  const h = 24;
  const x = (i: number) => (i / (pts.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / span) * h;
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg width={w} height={h} className="mt-2 overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke="var(--color-axis)" strokeWidth={1.5} strokeLinecap="round" />
      <circle
        cx={x(pts.length - 1)}
        cy={y(pts[pts.length - 1])}
        r={2.5}
        fill="var(--color-s1)"
        stroke="var(--color-surface)"
        strokeWidth={2}
      />
    </svg>
  );
}
