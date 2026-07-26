/**
 * Board view — all twelve CEOs at once, ranked on one measure at a time.
 */
import { useState } from "react";
import type { Derived } from "@/lib/metrics";
import { boardTotals } from "@/lib/metrics";
import { pct, pp, usd } from "@/lib/utils";
import { AnimatedTabs, BentoCard, BentoGrid, type TabItem } from "@/components/ui";
import { PayPerformanceChart } from "@/components/charts/pay-performance-chart";
import { RankingBars, type RankMeasure } from "@/components/charts/ranking-bars";
import { StatTile } from "@/components/stat-tile";

const MEASURES: RankMeasure[] = [
  {
    id: "alpha",
    label: "vs S&P 500",
    value: (d) => d.ret?.alphaPp ?? null,
    format: (n) => pp(n),
    diverging: true,
  },
  {
    id: "return",
    label: "Price return",
    value: (d) => d.ret?.totalPct ?? null,
    format: (n) => pct(n, 0),
    diverging: true,
  },
  {
    id: "cagr",
    label: "Annualised",
    value: (d) => d.ret?.cagrPct ?? null,
    format: (n) => pct(n),
    diverging: true,
  },
  {
    id: "buybacks",
    label: "Buybacks",
    value: (d) => d.capital?.totals.buybacks ?? null,
    format: (n) => usd(n),
  },
  {
    id: "dividends",
    label: "Dividends",
    value: (d) => d.capital?.totals.dividends ?? null,
    format: (n) => usd(n),
  },
  {
    id: "capex",
    label: "Capex",
    value: (d) => d.capital?.totals.capex ?? null,
    format: (n) => usd(n),
  },
  {
    id: "acq",
    label: "M&A cash",
    value: (d) => d.capital?.totals.acquisitions ?? null,
    format: (n) => usd(n),
  },
  {
    id: "pay",
    label: "Cumulative pay",
    value: (d) => (d.comp.cumulative > 0 ? d.comp.cumulative : null),
    format: (n) => usd(n),
  },
  {
    id: "tenure",
    label: "Tenure",
    value: (d) => d.tenureYrs,
    format: (n) => `${n.toFixed(1)} yr`,
  },
];

const TABS: TabItem<string>[] = MEASURES.map((m) => ({ id: m.id, label: m.label }));

export function Overview({
  rows,
  selectedId,
  onSelect,
}: {
  rows: Derived[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [measureId, setMeasureId] = useState("alpha");
  const measure = MEASURES.find((m) => m.id === measureId)!;
  const t = boardTotals(rows);

  return (
    <div className="space-y-4">
      <BentoGrid>
        <BentoCard span={3}>
          <StatTile
            label="Cash returned to holders"
            animate={t.buybacks + t.dividends}
            format={(n) => usd(n)}
            deltaLabel="buybacks + dividends, all tenures"
            size="lg"
          />
        </BentoCard>
        <BentoCard span={3} delay={0.04}>
          <StatTile
            label="Reinvested"
            animate={t.capex + t.acquisitions}
            format={(n) => usd(n)}
            deltaLabel="capex + acquisitions"
            size="lg"
          />
        </BentoCard>
        <BentoCard span={3} delay={0.08}>
          <StatTile
            label="Beating the index"
            value={`${t.beatingBench} / ${t.benchmarked}`}
            deltaLabel="on price return, same window"
            size="lg"
          />
        </BentoCard>
        <BentoCard span={3} delay={0.12}>
          <StatTile
            label="Median tenure"
            animate={t.medianTenure}
            format={(n) => `${n.toFixed(1)} yr`}
            deltaLabel={`across ${t.count} chief executives`}
            size="lg"
          />
        </BentoCard>

        <BentoCard
          span={7}
          eyebrow="Ranked"
          title={measure.label}
          action={
            <AnimatedTabs
              tabs={TABS}
              value={measureId}
              onChange={setMeasureId}
              layoutId="measure-pill"
              className="max-w-full"
            />
          }
        >
          <RankingBars
            rows={rows}
            measure={measure}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </BentoCard>

        <BentoCard span={5} eyebrow="Pay vs performance" title="Does paying more buy more return?">
          <PayPerformanceChart rows={rows} selectedId={selectedId} onSelect={onSelect} />
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
