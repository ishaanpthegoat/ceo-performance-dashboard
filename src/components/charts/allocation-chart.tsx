/**
 * Where the cash went, per fiscal year — capex, acquisitions, buybacks,
 * dividends. Stacked columns, because the question is both "how much in total"
 * and "in what mix", and a stack answers both at once.
 *
 * Ships a table view alongside the chart. That is not a nicety: two of the four
 * light-mode series sit below 3:1 against the light surface, and the palette
 * spec's relief rule requires either visible labels on every segment (which
 * would be unreadable at this density) or a table. So, a table.
 */
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import type { FiscalYear } from "@/lib/metrics";
import { usd } from "@/lib/utils";
import { ALLOCATION, AXIS, ChartEmpty, Legend, STACK_GAP, TooltipRow, TooltipShell } from "./chart-parts";
import { MagneticButton } from "@/components/ui";

export function AllocationChart({
  years,
  height = 300,
}: {
  years: FiscalYear[];
  height?: number;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  if (!years.length) {
    return <ChartEmpty>No fiscal-year filings available for this company yet.</ChartEmpty>;
  }

  const data = years.map((y) => ({
    fy: y.fy,
    capex: y.capex ?? 0,
    acquisitions: y.acquisitions ?? 0,
    buybacks: y.buybacks ?? 0,
    dividends: y.dividends ?? 0,
  }));

  const legend = ALLOCATION.map((a) => ({ label: a.label, color: a.color }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Legend items={legend} />
        <MagneticButton
          strength={5}
          onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
          className="flex items-center gap-1.5 !px-3 !py-1 text-xs"
          aria-label={view === "chart" ? "Show as table" : "Show as chart"}
        >
          {view === "chart" ? <Table2 className="size-3.5" /> : <BarChart3 className="size-3.5" />}
          {view === "chart" ? "Table" : "Chart"}
        </MagneticButton>
      </div>

      {view === "chart" ? (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barCategoryGap="26%">
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="fy"
                axisLine={{ stroke: AXIS.stroke }}
                tickLine={false}
                tick={AXIS.tick}
                minTickGap={8}
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
                  const row = payload[0].payload as (typeof data)[number];
                  const total = row.capex + row.acquisitions + row.buybacks + row.dividends;
                  return (
                    <TooltipShell title={`FY${label}`}>
                      {/* Reversed so the tooltip order matches the visual stack. */}
                      {[...ALLOCATION].reverse().map((a) => (
                        <TooltipRow
                          key={a.key}
                          color={a.color}
                          label={a.label}
                          value={usd(row[a.key])}
                        />
                      ))}
                      <div className="mt-1.5 border-t border-hairline pt-1.5">
                        <TooltipRow label="Total deployed" value={usd(total)} />
                      </div>
                    </TooltipShell>
                  );
                }}
              />
              {ALLOCATION.map((a, i) => (
                <Bar
                  key={a.key}
                  dataKey={a.key}
                  stackId="cash"
                  fill={a.color}
                  maxBarSize={24}
                  /* 2px surface-coloured gap does the separating between
                     segments — never a border drawn around the mark. */
                  stroke={STACK_GAP.stroke}
                  strokeWidth={STACK_GAP.strokeWidth}
                  /* Only the top segment gets rounded data-ends; the rest stay
                     square so the stack reads as one column. */
                  radius={i === ALLOCATION.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ maxHeight: height + 40 }}>
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Fiscal year</th>
                {ALLOCATION.map((a) => (
                  <th key={a.key} className="py-2 pr-3 text-right font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-2 rounded-[2px]"
                        style={{ background: a.color }}
                      />
                      {a.label}
                    </span>
                  </th>
                ))}
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((r) => (
                <tr key={r.fy} className="border-t border-hairline">
                  <td className="py-1.5 pr-3 tnum text-ink-2">FY{r.fy}</td>
                  {ALLOCATION.map((a) => (
                    <td key={a.key} className="py-1.5 pr-3 text-right tnum text-ink-2">
                      {r[a.key] ? usd(r[a.key]) : "—"}
                    </td>
                  ))}
                  <td className="py-1.5 text-right font-medium tnum text-ink">
                    {usd(r.capex + r.acquisitions + r.buybacks + r.dividends)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-xs text-muted">
        Cash actually paid out, from each year's cash-flow statement. A blank means the company
        did not report that line — not that it spent zero.
      </p>
    </div>
  );
}
