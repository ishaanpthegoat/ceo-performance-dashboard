/**
 * Executive compensation, decomposed by component, per fiscal year.
 *
 * The interesting thing about CEO pay data is that it is dominated by one-off
 * grants — Pichai's 2022 triennial award was $218M against $8.8M the next year.
 * A chart that just plots the totals tells you nothing except "there was a
 * grant". So: stacked components, and every distorted year carries its footnote
 * from the roster into the tooltip.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompRow } from "@/data/roster";
import { usd } from "@/lib/utils";
import { AXIS, ChartEmpty, Legend, SERIES, STACK_GAP, TooltipRow, TooltipShell } from "./chart-parts";

/** Slots 1–4 in stacking order, same validated sequence as the allocation chart. */
const PARTS = [
  { key: "salary", label: "Salary", color: SERIES[0] },
  { key: "bonus", label: "Cash incentive", color: SERIES[1] },
  { key: "equity", label: "Equity awards", color: SERIES[2] },
  { key: "other", label: "All other", color: SERIES[3] },
] as const;

export function CompChart({ rows, height = 260 }: { rows: CompRow[]; height?: number }) {
  const paid = rows.some((r) => r.total > 0);

  if (!rows.length) {
    return <ChartEmpty>No compensation rows recorded for this CEO.</ChartEmpty>;
  }
  if (!paid) {
    return (
      <ChartEmpty>
        This CEO's Summary Compensation Table total is $0 for every year on record — no salary, no
        bonus, and no newly granted equity. See the note below the chart.
      </ChartEmpty>
    );
  }

  return (
    <div>
      <Legend items={PARTS.map((p) => ({ label: p.label, color: p.color }))} className="mb-3" />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="fy"
              axisLine={{ stroke: AXIS.stroke }}
              tickLine={false}
              tick={AXIS.tick}
            />
            <YAxis
              tickFormatter={(v: number) => usd(v, { decimals: 0 })}
              axisLine={false}
              tickLine={false}
              tick={AXIS.tick}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-2)", opacity: 0.6 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as CompRow;
                return (
                  <TooltipShell title={`FY${label}`}>
                    {[...PARTS].reverse().map((p) =>
                      row[p.key] ? (
                        <TooltipRow key={p.key} color={p.color} label={p.label} value={usd(row[p.key])} />
                      ) : null,
                    )}
                    <div className="mt-1.5 border-t border-hairline pt-1.5">
                      <TooltipRow label="SCT total" value={usd(row.total)} />
                    </div>
                    {row.note && (
                      <p className="mt-1.5 max-w-[15rem] text-[11px] leading-snug text-muted">
                        {row.note}
                      </p>
                    )}
                  </TooltipShell>
                );
              }}
            />
            {PARTS.map((p, i) => (
              <Bar
                key={p.key}
                dataKey={p.key}
                stackId="pay"
                fill={p.color}
                maxBarSize={24}
                stroke={STACK_GAP.stroke}
                strokeWidth={STACK_GAP.strokeWidth}
                radius={i === PARTS.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">
        Summary Compensation Table totals from each year's proxy. Equity is grant-date fair value,
        which is what the company awarded — not what the CEO ultimately realised.
      </p>
    </div>
  );
}
