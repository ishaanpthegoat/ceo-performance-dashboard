/**
 * Shareholder return, indexed to 100 at the window's start, against the S&P 500.
 *
 * Indexed rather than dual-axis: the company and the benchmark trade at
 * completely different price levels, and a second y-scale is the single worst
 * chart mistake there is. Rebasing both to 100 puts them on one honest axis.
 *
 * A log scale is offered because NVIDIA's 143x makes every other line in a
 * shared view a flat smear on a linear axis.
 */
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReturnWindow } from "@/lib/metrics";
import { fmtMonth, num, pct } from "@/lib/utils";
import { AXIS, ChartEmpty, Legend, SERIES, TooltipRow, TooltipShell } from "./chart-parts";

export function ReturnChart({
  ret,
  companyLabel,
  scale = "linear",
  height = 300,
}: {
  ret: ReturnWindow | null;
  companyLabel: string;
  scale?: "linear" | "log";
  height?: number;
}) {
  if (!ret || ret.indexed.length < 2) {
    return (
      <ChartEmpty>
        No price history available for this symbol yet. Run <code>npm run sync</code> to fetch it.
      </ChartEmpty>
    );
  }

  const data = ret.indexed;
  const last = data[data.length - 1];
  const legend = [
    { label: companyLabel, color: SERIES[0], kind: "line" as const },
    { label: "S&P 500 (SPY)", color: SERIES[1], kind: "dash" as const },
  ];

  return (
    <div>
      <Legend items={legend} className="mb-3" />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 46, bottom: 4, left: 4 }}>
            <defs>
              {/* Area fill is a ~10% wash of the series hue, never a solid block. */}
              <linearGradient id="ret-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtMonth}
              minTickGap={44}
              axisLine={{ stroke: AXIS.stroke }}
              tickLine={false}
              tick={AXIS.tick}
            />
            <YAxis
              scale={scale === "log" ? "log" : "auto"}
              domain={scale === "log" ? ["auto", "auto"] : [0, "auto"]}
              allowDataOverflow={false}
              tickFormatter={(v: number) => num(v)}
              axisLine={false}
              tickLine={false}
              tick={AXIS.tick}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: AXIS.stroke, strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof data)[number];
                return (
                  <TooltipShell title={fmtMonth(String(label))}>
                    <TooltipRow
                      kind="line"
                      color={SERIES[0]}
                      label={companyLabel}
                      value={`${num(row.company)} (${pct(row.company - 100)})`}
                    />
                    <TooltipRow
                      kind="line"
                      color={SERIES[1]}
                      label="S&P 500"
                      value={`${num(row.benchmark)} (${pct(row.benchmark - 100)})`}
                    />
                  </TooltipShell>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="company"
              stroke="none"
              fill="url(#ret-wash)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke={SERIES[1]}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="company"
              stroke={SERIES[0]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              // ≥8px marker with a 2px surface ring, so it reads where lines cross.
              activeDot={{ r: 4, fill: SERIES[0], stroke: "var(--color-surface)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* One direct label at the endpoint — the value the reader came for. */}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-xs">
        <span className="text-muted">
          Indexed to 100 at {fmtMonth(ret.from)}
          {ret.truncated && " · window limited by available price history"}
        </span>
        <span className="tnum text-ink-2">
          <span className="font-semibold text-ink">{num(last.company)}</span> vs{" "}
          {num(last.benchmark)} benchmark
        </span>
      </div>
    </div>
  );
}
