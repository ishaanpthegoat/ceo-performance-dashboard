/**
 * Pay against performance, one dot per CEO.
 *
 * Scatter uses the all-pairs colour rule rather than the adjacent one, which
 * caps a categorical palette at three slots. So this is deliberately a
 * SINGLE-series chart: every CEO is slot 1, and the selected one is promoted to
 * slot 2. Colouring twelve dots twelve ways would fail the CVD gate and would
 * not help anyone read it.
 */
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Derived } from "@/lib/metrics";
import { pp, usd } from "@/lib/utils";
import { AXIS, ChartEmpty, Legend, SERIES, TooltipRow, TooltipShell } from "./chart-parts";

export function PayPerformanceChart({
  rows,
  selectedId,
  onSelect,
  height = 340,
}: {
  rows: Derived[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const points = rows
    .filter((r) => r.ret && r.comp.cumulative > 0)
    .map((r) => ({
      id: r.profile.id,
      name: r.profile.ceo,
      ticker: r.profile.ticker,
      /** Cumulative disclosed pay across the years we hold, in $M. */
      pay: r.comp.cumulative / 1e6,
      /** Benchmark-relative price return over the window, in pp. */
      alpha: r.ret!.alphaPp,
      selected: r.profile.id === selectedId,
    }));

  if (points.length < 2) {
    return <ChartEmpty>Not enough paired pay and return data to plot yet.</ChartEmpty>;
  }

  const field = points.filter((p) => !p.selected);
  const chosen = points.filter((p) => p.selected);

  return (
    <div>
      <Legend
        items={[
          { label: "CEO", color: SERIES[0] },
          ...(chosen.length ? [{ label: "Selected", color: SERIES[1] }] : []),
        ]}
        className="mb-3"
      />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 20, bottom: 20, left: 4 }}>
            <CartesianGrid />
            <XAxis
              type="number"
              dataKey="pay"
              name="Cumulative pay"
              tickFormatter={(v: number) => `$${v.toFixed(0)}M`}
              axisLine={{ stroke: AXIS.stroke }}
              tickLine={false}
              tick={AXIS.tick}
              label={{
                value: "Cumulative disclosed pay",
                position: "insideBottom",
                offset: -12,
                style: { fill: "var(--color-muted)", fontSize: 11 },
              }}
            />
            <YAxis
              type="number"
              dataKey="alpha"
              name="Return vs S&P 500"
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}`}
              axisLine={false}
              tickLine={false}
              tick={AXIS.tick}
              width={52}
              label={{
                value: "vs S&P 500 (pp)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(--color-muted)", fontSize: 11, textAnchor: "middle" },
              }}
            />
            <ZAxis range={[90, 90]} />
            {/* Zero line is the only reference that matters: above it the CEO
                beat the index, below it they did not. */}
            <ReferenceLine y={0} stroke={AXIS.stroke} strokeWidth={1} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof points)[number];
                return (
                  <TooltipShell title={`${p.name} · ${p.ticker}`}>
                    <TooltipRow label="vs S&P 500" value={pp(p.alpha)} />
                    <TooltipRow label="Cumulative pay" value={usd(p.pay * 1e6)} />
                  </TooltipShell>
                );
              }}
            />
            <Scatter
              data={field}
              fill={SERIES[0]}
              stroke="var(--color-surface)"
              strokeWidth={2}
              onClick={(d: unknown) => onSelect?.((d as { id: string }).id)}
              className="cursor-pointer"
              isAnimationActive={false}
            />
            {chosen.length > 0 && (
              <Scatter
                data={chosen}
                fill={SERIES[1]}
                stroke="var(--color-surface)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">
        Vertical axis is price return minus the S&P 500 over the same window, so a dot above the
        line beat the index. Horizontal axis sums the Summary Compensation Table totals this
        dashboard holds — a longer record means a larger sum, so read position, not rank.
      </p>
    </div>
  );
}
