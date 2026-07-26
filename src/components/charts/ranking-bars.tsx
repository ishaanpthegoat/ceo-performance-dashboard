/**
 * Cross-company ranking. One measure, twelve companies, sorted.
 *
 * Single series, so no legend — the heading names the measure. Values ride the
 * bar tips as direct labels, which is the whole point of this form: you read the
 * number off the bar, not off an axis.
 */
import { motion } from "framer-motion";
import type { Derived } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/use-reveal";
import { SERIES } from "./chart-parts";

/** The bar itself. Growing it is decoration — the value label carries the
 *  number regardless, and the reveal has a timer fallback so a bar is never
 *  stuck at zero width. */
function Bar({
  index,
  color,
  negative,
  share,
  diverging,
}: {
  index: number;
  color: string;
  negative: boolean;
  share: number;
  diverging: boolean;
}) {
  const { ref, revealed } = useReveal<HTMLSpanElement>({ rootMargin: "0px" });

  return (
    <motion.span
      ref={ref}
      aria-hidden
      initial={{ scaleX: 0 }}
      animate={revealed ? { scaleX: 1 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
      className={cn("h-2.5", negative ? "rounded-l-[4px]" : "rounded-r-[4px]")}
      style={{
        background: color,
        width: `${diverging ? share / 2 : share}%`,
        position: diverging ? "absolute" : "relative",
        transformOrigin: diverging && negative ? "right" : "left",
        ...(diverging ? (negative ? { right: "50%" } : { left: "50%" }) : {}),
      }}
    />
  );
}

export type RankMeasure = {
  id: string;
  label: string;
  /** Null pulls the row out of the ranking entirely. */
  value: (d: Derived) => number | null;
  format: (n: number) => string;
  /** Diverging measures (return vs benchmark) get a signed two-hue treatment. */
  diverging?: boolean;
};

export function RankingBars({
  rows,
  measure,
  selectedId,
  onSelect,
}: {
  rows: Derived[];
  measure: RankMeasure;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const items = rows
    .map((r) => ({ row: r, v: measure.value(r) }))
    .filter((x): x is { row: Derived; v: number } => x.v != null)
    .sort((a, b) => b.v - a.v);

  if (!items.length) {
    return <p className="py-8 text-center text-sm text-muted">No data for this measure.</p>;
  }

  // Scale to the largest magnitude so negative bars share the axis.
  const max = Math.max(...items.map((i) => Math.abs(i.v))) || 1;
  const hasNegative = items.some((i) => i.v < 0);

  return (
    <ul className="space-y-1">
      {items.map(({ row, v }, i) => {
        const share = (Math.abs(v) / max) * 100;
        const negative = v < 0;
        // Diverging: blue for positive, red for negative, with a gray zero
        // midpoint implied by the shared baseline. Never a hue at the midpoint.
        const color = measure.diverging
          ? negative
            ? "var(--color-s8)"
            : SERIES[0]
          : SERIES[0];
        const selected = row.profile.id === selectedId;

        return (
          <li key={row.profile.id}>
            <button
              onClick={() => onSelect?.(row.profile.id)}
              className={cn(
                "group grid w-full grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors sm:grid-cols-[10rem_1fr_6rem]",
                selected ? "bg-surface-2" : "hover:bg-surface-2/60",
              )}
            >
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="truncate text-sm font-medium text-ink">{row.profile.ceo}</span>
                <span className="shrink-0 text-[10px] tnum text-muted">{row.profile.ticker}</span>
              </span>

              {/* Track. Negative bars grow left from the centre, positive right. */}
              <span
                className={cn(
                  "relative flex h-5 items-center",
                  hasNegative && measure.diverging && "justify-center",
                )}
              >
                {hasNegative && measure.diverging && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-1/2 w-px bg-axis"
                  />
                )}
                <Bar
                  index={i}
                  color={color}
                  negative={negative}
                  share={share}
                  diverging={Boolean(hasNegative && measure.diverging)}
                />
              </span>

              <span className="text-right text-sm font-medium tnum text-ink">
                {measure.format(v)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
