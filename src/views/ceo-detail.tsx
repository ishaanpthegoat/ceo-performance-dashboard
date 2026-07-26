/**
 * Single-CEO view: tenure, returns, capital allocation, acquisitions, pay.
 */
import { useState } from "react";
import { ArrowUpRight, Building2, CalendarDays, Landmark, TrendingDown } from "lucide-react";
import type { Derived } from "@/lib/metrics";
import { fmtDate, pct, pp, tenureLabel, usd } from "@/lib/utils";
import {
  AnimatedList,
  AnimatedListItem,
  BentoCard,
  BentoGrid,
  BorderBeam,
  MagneticButton,
  SpotlightCard,
  Timeline,
  type TimelineEntry,
} from "@/components/ui";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { CompChart } from "@/components/charts/comp-chart";
import { ReturnChart } from "@/components/charts/return-chart";
import { StatTile } from "@/components/stat-tile";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  closed: { color: "var(--color-good)", label: "Closed" },
  pending: { color: "var(--color-warning)", label: "Pending" },
  terminated: { color: "var(--color-serious)", label: "Abandoned" },
  blocked: { color: "var(--color-critical)", label: "Blocked" },
};

export function CeoDetail({ row }: { row: Derived }) {
  const [scale, setScale] = useState<"linear" | "log">("linear");
  const { profile: p, ret, capital, comp, acq } = row;

  const timeline: TimelineEntry[] = [
    ...(p.priorTenure
      ? [
          {
            id: "prior-start",
            marker: new Date(p.priorTenure.start).getFullYear(),
            title: `First tenure begins`,
            body: `${fmtDate(p.priorTenure.start)} — ${fmtDate(p.priorTenure.end)}. Stepped down, then returned.`,
            accent: "var(--color-s7)",
          },
        ]
      : []),
    {
      id: "start",
      marker: new Date(p.start).getFullYear(),
      title: p.priorTenure ? "Returns as chief executive" : "Becomes chief executive",
      body: `${fmtDate(p.start)}${p.founder ? " · founder-led" : ""}`,
    },
    ...[...p.acquisitions]
      .sort((a, b) => a.year - b.year)
      .map((a) => ({
        id: `acq-${a.name}`,
        marker: a.year,
        title: (
          <span className="flex flex-wrap items-baseline gap-x-2">
            {a.name}
            <span className="text-xs font-normal tnum text-muted">
              {a.value != null ? usd(a.value) : "undisclosed"}
            </span>
            <StatusChip status={a.status} />
          </span>
        ),
        body: a.rationale,
        accent: STATUS_STYLE[a.status]?.color,
      })),
    {
      id: "now",
      marker: "Today",
      title: p.end ? `Departed ${fmtDate(p.end)}` : `${tenureLabel(p.start, p.end)} in the chair`,
      body: p.end ? undefined : "Still serving.",
      accent: "var(--color-s3)",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Headline card */}
      <SpotlightCard className="overflow-hidden p-6">
        <BorderBeam duration={9} radius={16} />
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium tnum text-ink-2">
                {p.ticker}
              </span>
              <span>{p.sector}</span>
              {p.founder && (
                <span className="flex items-center gap-1">
                  <Building2 className="size-3" /> Founder-led
                </span>
              )}
              {row.stale && (
                <span
                  className="flex items-center gap-1 font-medium"
                  style={{ color: "var(--color-warning)" }}
                >
                  Served from cache
                </span>
              )}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {p.ceo}
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">{row.entityName}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2">{p.doctrine}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-2">
            <StatTile
              label="Tenure"
              value={tenureLabel(p.start, p.end)}
              deltaLabel={`since ${fmtDate(p.start)}`}
            />
            <StatTile
              label="Last close"
              value={row.latestClose != null ? `$${row.latestClose.toFixed(2)}` : "—"}
              deltaLabel={p.ticker}
            />
            <StatTile
              label={ret?.truncated ? "10-yr price return" : "Return in post"
              }
              value={ret ? pct(ret.totalPct, 0) : "—"}
              deltaLabel={ret ? `${pct(ret.cagrPct, 1)} a year` : undefined}
              note={
                ret?.truncated
                  ? `Price history reaches back to ${fmtDate(ret.from)}, which is after this CEO took office, so this is the trailing window rather than the full tenure.`
                  : "Measured from the month this CEO took office."
              }
            />
            <StatTile
              label="vs S&P 500"
              value={ret ? pp(ret.alphaPp) : "—"}
              note="Price return minus the index over the identical window. Excludes dividends on both sides."
            />
          </dl>
        </div>
      </SpotlightCard>

      <BentoGrid>
        <BentoCard
          span={7}
          eyebrow="Shareholder return"
          title="Indexed to 100 against the S&P 500"
          action={
            <div className="flex gap-1">
              {(["linear", "log"] as const).map((s) => (
                <MagneticButton
                  key={s}
                  strength={4}
                  active={scale === s}
                  onClick={() => setScale(s)}
                  className="!px-2.5 !py-1 text-xs"
                >
                  {s === "linear" ? "Linear" : "Log"}
                </MagneticButton>
              ))}
            </div>
          }
        >
          <ReturnChart ret={ret} companyLabel={p.ticker} scale={scale} height={296} />
        </BentoCard>

        <BentoCard span={5} eyebrow="Risk" title="What holders had to sit through">
          <div className="grid grid-cols-2 gap-5">
            <StatTile
              label="Max drawdown"
              value={ret ? pct(ret.maxDrawdownPct, 0) : "—"}
              upIsGood={false}
              note="Largest peak-to-trough fall in the monthly close series inside the window."
            />
            <StatTile
              label="Annualised"
              value={ret ? pct(ret.cagrPct) : "—"}
              deltaLabel={ret ? `over ${ret.years.toFixed(1)} years` : undefined}
            />
            <StatTile
              label="Index over window"
              value={ret ? pct(ret.benchPct, 0) : "—"}
              deltaLabel="S&P 500, same months"
            />
            <StatTile
              label="Cash returned"
              value={capital ? usd(capital.totals.buybacks + capital.totals.dividends) : "—"}
              deltaLabel="during tenure"
            />
          </div>
          {ret && (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-surface-2/60 p-3 text-xs leading-relaxed text-ink-2">
              <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-muted" />
              <span>
                Returns here are <strong className="font-semibold text-ink">price only</strong> —
                split-adjusted closes, no dividends reinvested. For {p.ticker} the dividends show up
                on the capital-allocation panel as actual cash paid.
              </span>
            </p>
          )}
        </BentoCard>

        <BentoCard
          id="allocation"
          span={7}
          eyebrow="Capital allocation"
          title="Where the cash went, by fiscal year"
        >
          <AllocationChart years={capital?.tenureYears ?? []} height={288} />
        </BentoCard>

        <BentoCard span={5} eyebrow="Allocation mix" title="Return versus reinvest">
          {capital ? (
            <div className="space-y-5">
              <AllocationMeter capital={capital} />
              <div className="grid grid-cols-2 gap-5">
                <StatTile
                  label="Buybacks"
                  animate={capital.totals.buybacks}
                  format={(n) => usd(n)}
                />
                <StatTile
                  label="Dividends"
                  animate={capital.totals.dividends}
                  format={(n) => usd(n)}
                />
                <StatTile label="Capex" animate={capital.totals.capex} format={(n) => usd(n)} />
                <StatTile
                  label="M&A cash"
                  animate={capital.totals.acquisitions}
                  format={(n) => usd(n)}
                />
              </div>
              <StatTile
                label="Share of operating cash flow returned"
                value={
                  capital.payoutRatio != null ? `${capital.payoutRatio.toFixed(0)}%` : "Not meaningful"
                }
                deltaLabel={
                  capital.ocfUnreliable
                    ? "operating cash flow swings on the balance sheet here"
                    : "buybacks + dividends ÷ operating cash flow"
                }
                note={
                  capital.ocfUnreliable
                    ? "For banks, operating cash flow moves with trading and loan books rather than with the business, so a payout ratio built on it is noise. Suppressed rather than printed."
                    : undefined
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted">No filings loaded.</p>
          )}
        </BentoCard>

        <BentoCard span={7} eyebrow="Tenure & deals" title="The record, in order">
          <Timeline entries={timeline} />
        </BentoCard>

        <BentoCard id="acquisitions" span={5} eyebrow="Acquisitions" title="Announced deals">
          <div className="mb-4 grid grid-cols-3 gap-4">
            <StatTile label="Disclosed" value={usd(acq.disclosedTotal)} />
            <StatTile label="Closed" value={String(acq.closedCount)} />
            <StatTile
              label="Failed"
              value={String(acq.failedCount)}
              note="Deals announced then abandoned or blocked by a regulator."
            />
          </div>
          <AnimatedList as="ul" className="space-y-1.5">
            {[...p.acquisitions]
              .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
              .map((a) => (
                <AnimatedListItem
                  as="li"
                  key={a.name}
                  className="rounded-lg bg-surface-2/50 p-2.5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-sm font-medium text-ink">{a.name}</span>
                    <span className="shrink-0 text-sm font-medium tnum text-ink-2">
                      {a.value != null ? usd(a.value) : "n/d"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs tnum text-muted">{a.year}</span>
                    <StatusChip status={a.status} />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{a.rationale}</p>
                </AnimatedListItem>
              ))}
          </AnimatedList>
        </BentoCard>

        <BentoCard span={7} eyebrow="Executive compensation" title="Pay, decomposed by component">
          <CompChart rows={comp.rows} height={268} />
        </BentoCard>

        <BentoCard span={5} eyebrow="Pay in context" title="What the proxies say">
          <div className="grid grid-cols-2 gap-5">
            <StatTile
              label="Latest SCT total"
              value={comp.latest ? usd(comp.latest.total) : "—"}
              deltaLabel={comp.latest ? `FY${comp.latest.fy}` : undefined}
            />
            <StatTile
              label="Median year"
              value={usd(comp.medianTotal)}
              note="Median resists mega-grant years, which is why it sits beside the latest figure rather than instead of it."
            />
            <StatTile
              label="Cumulative"
              value={usd(comp.cumulative)}
              deltaLabel={`${comp.rows.length} years on record`}
            />
            <StatTile
              label="pp per $1M paid"
              value={comp.payEfficiency != null ? comp.payEfficiency.toFixed(1) : "—"}
              note="Percentage points of benchmark-relative return per $1M of cumulative disclosed pay. A crude ratio, and it flatters CEOs who are paid in $1 salaries."
            />
          </div>

          {comp.latest?.note && (
            <p className="mt-5 rounded-lg bg-surface-2/60 p-3 text-xs leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">FY{comp.latest.fy} note. </span>
              {comp.latest.note}
            </p>
          )}

          <a
            href={p.source}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 transition-colors hover:text-ink"
          >
            <Landmark className="size-3.5" />
            Proxy statements on EDGAR
            <ArrowUpRight className="size-3" />
          </a>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays className="size-3" />
            Tenure, deals and pay verified {fmtDate(p.verifiedAsOf)}
          </p>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status];
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-2">
      {/* Status colour rides a dot beside the word, never the word itself. */}
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

/** Meter: fill carries the split, track is a lighter step of the same ramp. */
function AllocationMeter({ capital }: { capital: NonNullable<Derived["capital"]> }) {
  const { buybacks, dividends, capex, acquisitions } = capital.totals;
  const total = buybacks + dividends + capex + acquisitions;
  if (total <= 0) return null;
  const returned = ((buybacks + dividends) / total) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-ink-2">Returned to holders</span>
        <span className="font-semibold tnum text-ink">{returned.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--color-s1)", opacity: 1 }}>
        <div
          className={cn("h-full rounded-full")}
          style={{ width: `${returned}%`, background: "var(--color-s3)" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>Reinvested {(100 - returned).toFixed(0)}%</span>
        <span>of {usd(total)} deployed</span>
      </div>
    </div>
  );
}
