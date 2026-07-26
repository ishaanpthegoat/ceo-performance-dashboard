/**
 * Joins the curated roster to the SEC/price data and derives every number the
 * dashboard displays. Nothing downstream of here does arithmetic on raw JSON.
 *
 * The one thing to understand: PRICE HISTORY IS ~10 YEARS DEEP. The free quote
 * APIs cap there. So a "return since the CEO started" is only literally that
 * for CEOs appointed inside the window (Pichai, Jassy, Iger's second stint,
 * Sarandos, Vachris). For the longer-serving ones it is the trailing 10 years,
 * and `returnWindow.truncated` says so. The UI must render that distinction —
 * quietly claiming Jensen Huang delivered 14,390% "as CEO" when he has been
 * there since 1993 would be a lie by omission.
 */

import { ROSTER, type CeoProfile, type CompRow } from "@/data/roster";
import { cagr, sum, tenureYears } from "@/lib/utils";

export type FiscalYear = {
  fy: number;
  fiscalEnd: string;
  buybacks?: number;
  dividends?: number;
  acquisitions?: number;
  capex?: number;
  operatingCashFlow?: number;
  revenue?: number;
  netIncome?: number;
  rnd?: number;
};

export type FinancialsFile = {
  generatedAt: string;
  source: string;
  note: string;
  companies: Record<
    string,
    { entityName: string; cik: string; tagsUsed: Record<string, string>; years: FiscalYear[] }
  >;
};

export type PricePoint = { date: string; close: number };

export type PricesFile = {
  generatedAt: string;
  note: string;
  symbols: Record<
    string,
    {
      ticker: string;
      source: string;
      basis: string;
      first: string | null;
      last: string | null;
      latestClose: number | null;
      monthly: PricePoint[];
    }
  >;
};

export type MetaFile = {
  generatedAt: string;
  financials: { ok: string[]; cached: string[]; failed: string[] };
  prices: { ok: string[]; cached: string[]; failed: string[] };
};

export type ReturnWindow = {
  from: string;
  to: string;
  years: number;
  /** True when the window starts later than the CEO did, because data ran out. */
  truncated: boolean;
  /** Price return over the window, %. */
  totalPct: number;
  cagrPct: number | null;
  /** Benchmark price return over the identical window, %. */
  benchPct: number;
  /** totalPct - benchPct, in percentage points. */
  alphaPp: number;
  /** Indexed to 100 at `from`, for the chart. */
  indexed: { date: string; company: number; benchmark: number }[];
  /** Largest peak-to-trough drop inside the window, as a negative %. */
  maxDrawdownPct: number;
};

export type CapitalAllocation = {
  years: FiscalYear[];
  /** Only the fiscal years that fall inside the CEO's tenure. */
  tenureYears: FiscalYear[];
  totals: {
    buybacks: number;
    dividends: number;
    acquisitions: number;
    capex: number;
    operatingCashFlow: number;
  };
  /** Share of operating cash flow returned to holders. Null when OCF is unusable. */
  payoutRatio: number | null;
  /** Share of the four uses that went to buybacks + dividends. */
  returnedShare: number | null;
  ocfUnreliable: boolean;
};

export type Derived = {
  profile: CeoProfile;
  entityName: string;
  tenureYrs: number;
  latestClose: number | null;
  ret: ReturnWindow | null;
  capital: CapitalAllocation | null;
  comp: {
    rows: CompRow[];
    latest: CompRow | null;
    /** Median SCT total — resistant to mega-grant years like Pichai's 2022. */
    medianTotal: number;
    cumulative: number;
    /** Percentage points of benchmark-relative return per $1M of cumulative pay. */
    payEfficiency: number | null;
  };
  acq: {
    disclosedTotal: number;
    closedCount: number;
    failedCount: number;
    largest: number | null;
  };
  /** True when this company's numbers came from cache rather than a live fetch. */
  stale: boolean;
};

/**
 * Banks report operating cash flow that swings on trading-book and loan
 * movements, not on business performance — JPM posted -$147.8B in FY2025.
 * Ratios built on that denominator are noise, so we suppress them rather than
 * print a nonsense percentage.
 */
const OCF_UNRELIABLE = new Set(["jpm"]);

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function buildReturn(monthly: PricePoint[], bench: PricePoint[], ceoStart: string): ReturnWindow | null {
  if (monthly.length < 2 || bench.length < 2) return null;

  // Align to the months both series have, then clip to the CEO's start date.
  const benchBy = new Map(bench.map((p) => [p.date.slice(0, 7), p.close]));
  const startMonth = ceoStart.slice(0, 7);
  const pairs = monthly
    .filter((p) => benchBy.has(p.date.slice(0, 7)) && p.date.slice(0, 7) >= startMonth)
    .map((p) => ({ date: p.date, company: p.close, benchmark: benchBy.get(p.date.slice(0, 7))! }));

  if (pairs.length < 2) return null;

  const first = pairs[0];
  const last = pairs[pairs.length - 1];
  const totalPct = (last.company / first.company - 1) * 100;
  const benchPct = (last.benchmark / first.benchmark - 1) * 100;
  const years = (Date.parse(last.date) - Date.parse(first.date)) / 3.15576e10;

  let peak = first.company;
  let maxDd = 0;
  for (const p of pairs) {
    peak = Math.max(peak, p.company);
    maxDd = Math.min(maxDd, (p.company / peak - 1) * 100);
  }

  return {
    from: first.date,
    to: last.date,
    years,
    truncated: first.date.slice(0, 7) > startMonth,
    totalPct,
    cagrPct: cagr(totalPct, years),
    benchPct,
    alphaPp: totalPct - benchPct,
    maxDrawdownPct: maxDd,
    indexed: pairs.map((p) => ({
      date: p.date,
      company: (p.company / first.company) * 100,
      benchmark: (p.benchmark / first.benchmark) * 100,
    })),
  };
}

function buildCapital(years: FiscalYear[], profile: CeoProfile): CapitalAllocation {
  const startYear = new Date(profile.start).getFullYear();
  const inTenure = years.filter((y) => y.fy >= startYear);
  const scope = inTenure.length ? inTenure : years;

  const totals = {
    buybacks: sum(scope.map((y) => y.buybacks)),
    dividends: sum(scope.map((y) => y.dividends)),
    acquisitions: sum(scope.map((y) => y.acquisitions)),
    capex: sum(scope.map((y) => y.capex)),
    operatingCashFlow: sum(scope.map((y) => y.operatingCashFlow)),
  };

  const returned = totals.buybacks + totals.dividends;
  const deployed = returned + totals.acquisitions + totals.capex;
  const ocfUnreliable = OCF_UNRELIABLE.has(profile.id) || totals.operatingCashFlow <= 0;

  return {
    years,
    tenureYears: scope,
    totals,
    payoutRatio: ocfUnreliable ? null : (returned / totals.operatingCashFlow) * 100,
    returnedShare: deployed > 0 ? (returned / deployed) * 100 : null,
    ocfUnreliable,
  };
}

export function derive(
  financials: FinancialsFile | null,
  prices: PricesFile | null,
  meta: MetaFile | null,
): Derived[] {
  const bench = prices?.symbols?.benchmark?.monthly ?? [];
  const staleTickers = new Set([
    ...(meta?.financials.cached ?? []),
    ...(meta?.prices.cached ?? []),
  ]);

  return ROSTER.map((profile) => {
    const fin = financials?.companies?.[profile.id] ?? null;
    const px = prices?.symbols?.[profile.id] ?? null;

    const ret = px ? buildReturn(px.monthly, bench, profile.start) : null;
    const capital = fin ? buildCapital(fin.years, profile) : null;

    const rows = profile.compensation;
    const cumulative = sum(rows.map((r) => r.total));

    // Scale-free and honest about what it is: percentage points of
    // benchmark-relative return earned per $1M of cumulative disclosed pay.
    // Not "value created" — we have no share count deep enough for that.
    const payEfficiency = ret && cumulative > 0 ? ret.alphaPp / (cumulative / 1e6) : null;

    const disclosed = profile.acquisitions.filter((a) => a.value != null).map((a) => a.value!);

    return {
      profile,
      entityName: fin?.entityName ?? profile.company,
      tenureYrs: tenureYears(profile.start, profile.end),
      latestClose: px?.latestClose ?? null,
      ret,
      capital,
      comp: {
        rows,
        latest: rows.length ? rows[rows.length - 1] : null,
        medianTotal: median(rows.map((r) => r.total)),
        cumulative,
        payEfficiency,
      },
      acq: {
        disclosedTotal: sum(disclosed),
        closedCount: profile.acquisitions.filter((a) => a.status === "closed").length,
        failedCount: profile.acquisitions.filter(
          (a) => a.status === "terminated" || a.status === "blocked",
        ).length,
        largest: disclosed.length ? Math.max(...disclosed) : null,
      },
      stale: staleTickers.has(profile.ticker),
    };
  });
}

/** Board-level aggregates for the header. */
export function boardTotals(rows: Derived[]) {
  const withRet = rows.filter((r) => r.ret);
  return {
    count: rows.length,
    buybacks: sum(rows.map((r) => r.capital?.totals.buybacks)),
    dividends: sum(rows.map((r) => r.capital?.totals.dividends)),
    capex: sum(rows.map((r) => r.capital?.totals.capex)),
    acquisitions: sum(rows.map((r) => r.capital?.totals.acquisitions)),
    pay: sum(rows.map((r) => r.comp.cumulative)),
    medianTenure: median(rows.map((r) => r.tenureYrs)),
    beatingBench: withRet.filter((r) => r.ret!.alphaPp > 0).length,
    benchmarked: withRet.length,
  };
}
