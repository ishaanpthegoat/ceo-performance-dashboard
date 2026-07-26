import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Coins,
  LayoutGrid,
  Moon,
  RefreshCw,
  ShoppingBag,
  Sun,
  Users,
} from "lucide-react";
import { ROSTER } from "@/data/roster";
import {
  boardTotals,
  derive,
  type Derived,
  type FinancialsFile,
  type MetaFile,
  type PricesFile,
} from "@/lib/metrics";
import { fmtDate, pct, pp, usd } from "@/lib/utils";
import {
  AuroraBackground,
  CommandPalette,
  type CommandItem,
  Dock,
  DockItem,
  DotPattern,
  Marquee,
  Meteors,
  ScrollProgress,
  TextShimmer,
  TiltCard,
} from "@/components/ui";
import { Overview } from "@/views/overview";
import { CeoDetail } from "@/views/ceo-detail";
import { NumberTicker } from "@/components/ui";

const BASE = import.meta.env.BASE_URL;

type Loaded = {
  financials: FinancialsFile | null;
  prices: PricesFile | null;
  meta: MetaFile | null;
};

async function loadJson<T>(name: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}data/${name}`, { cache: "no-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type View = "board" | "ceo";

/**
 * The location hash is the source of truth for which view is showing, so a
 * reader can link straight to `#/ceo/avgo` and the back button works. Parsed
 * defensively — an unknown id falls back to the board rather than rendering an
 * empty detail page.
 */
function parseHash(hash: string): { view: View; id: string } {
  const m = /^#\/ceo\/([a-z0-9-]+)$/i.exec(hash);
  const id = m?.[1]?.toLowerCase();
  if (id && ROSTER.some((r) => r.id === id)) return { view: "ceo", id };
  return { view: "board", id: ROSTER[0].id };
}

export default function App() {
  const [data, setData] = useState<Loaded | null>(null);
  const initial = parseHash(window.location.hash);
  const [selectedId, setSelectedId] = useState(initial.id);
  const [view, setView] = useState<View>(initial.view);
  const [dark, setDark] = useState(true);

  // Keep the hash and the state in step in both directions.
  //
  // The `hashchange` listener covers normal navigation and the back button. The
  // extra read on mount covers the case where the hash was set between module
  // evaluation and this component mounting, or changed via history.replaceState
  // — neither of which fires hashchange, and both of which would otherwise
  // leave the URL pointing at one view while a different one renders.
  useEffect(() => {
    const sync = () => {
      const next = parseHash(window.location.hash);
      setView(next.view);
      setSelectedId(next.id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = (nextView: View, id?: string) => {
    const nextId = id ?? selectedId;
    const hash = nextView === "ceo" ? `#/ceo/${nextId}` : "#/";
    if (window.location.hash !== hash) window.location.hash = hash;
    setView(nextView);
    if (id) setSelectedId(id);
  };

  useEffect(() => {
    Promise.all([
      loadJson<FinancialsFile>("financials.json"),
      loadJson<PricesFile>("prices.json"),
      loadJson<MetaFile>("meta.json"),
    ]).then(([financials, prices, meta]) => setData({ financials, prices, meta }));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  const rows = useMemo(
    () => (data ? derive(data.financials, data.prices, data.meta) : []),
    [data],
  );
  const selected = rows.find((r) => r.profile.id === selectedId) ?? rows[0];

  const commands: CommandItem[] = useMemo(() => {
    const ceoCmds = rows.map((r) => ({
      id: `ceo-${r.profile.id}`,
      label: `${r.profile.ceo} · ${r.profile.company}`,
      group: "Chief executives",
      hint: r.ret ? pp(r.ret.alphaPp) : r.profile.ticker,
      keywords: `${r.profile.ticker} ${r.profile.sector}`,
      onSelect: () => go("ceo", r.profile.id),
    }));
    return [
      {
        id: "view-board",
        label: "Board overview — all CEOs ranked",
        group: "Views",
        onSelect: () => go("board"),
      },
      {
        id: "view-ceo",
        label: "CEO detail",
        group: "Views",
        onSelect: () => go("ceo"),
      },
      {
        id: "theme",
        label: dark ? "Switch to light theme" : "Switch to dark theme",
        group: "Views",
        onSelect: () => setDark((v) => !v),
      },
      ...ceoCmds,
    ];
  }, [rows, dark]);

  if (!data) return <Booting />;

  const t = boardTotals(rows);
  const generatedAt = data.meta?.generatedAt ?? data.financials?.generatedAt ?? null;

  return (
    <div className="min-h-screen">
      <ScrollProgress />

      {/* ------------------------------------------------ hero */}
      <AuroraBackground intensity={dark ? 0.32 : 0.2}>
        <Meteors count={14} />
        <DotPattern size={26} />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
                <span className="inline-block size-1.5 rounded-full" style={{ background: "var(--color-good)" }} />
                Rebuilt from SEC filings every two weeks
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
                Chief
              </h1>
              <TextShimmer
                as="p"
                className="mt-2 max-w-2xl text-base leading-relaxed sm:text-lg"
                duration={5}
              >
                Twelve mega-cap chief executives, measured on the only things that leave a paper
                trail: how long they lasted, what the stock did, where the cash went, and what
                they were paid for it.
              </TextShimmer>
            </div>

            <div className="flex items-center gap-2">
              <CommandPalette items={commands} />
              <button
                onClick={() => setDark((v) => !v)}
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2 transition-colors hairline hover:text-ink"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </div>
          </header>

          {/* Hero figure — exactly one per view. */}
          <TiltCard className="mt-10 max-w-3xl p-6 sm:p-8" max={5}>
            <p className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
              Cash these twelve moved during their tenures
            </p>
            <p className="mt-2 text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
              <NumberTicker
                value={t.buybacks + t.dividends + t.capex + t.acquisitions}
                format={(n) => usd(n, { decimals: 2 })}
              />
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {[
                { label: "Buybacks", v: t.buybacks },
                { label: "Dividends", v: t.dividends },
                { label: "Capex", v: t.capex },
                { label: "M&A cash", v: t.acquisitions },
              ].map((x, i) => (
                <div key={x.label}>
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] text-muted uppercase">
                    <span
                      aria-hidden
                      className="size-2 rounded-[2px]"
                      style={{ background: `var(--color-s${i + 1})` }}
                    />
                    {x.label}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-ink">{usd(x.v)}</dd>
                </div>
              ))}
            </dl>
          </TiltCard>

          <p className="mt-4 text-xs text-muted">
            {generatedAt ? `Financial data synced ${fmtDate(generatedAt)}.` : "Awaiting first sync."}{" "}
            Buybacks, dividends, capex and M&A cash come straight from cash-flow statements on
            EDGAR. Tenure, named deals and pay are hand-verified from proxy filings.
          </p>
        </div>
      </AuroraBackground>

      {/* ------------------------------------------------ ticker */}
      <div className="border-y border-hairline bg-page/60 py-3 backdrop-blur">
        <Marquee speed={70} gap="2.5rem">
          {rows.map((r) => (
            <button
              key={r.profile.id}
              onClick={() => go("ceo", r.profile.id)}
              className="flex shrink-0 items-baseline gap-2 text-sm transition-opacity hover:opacity-70"
            >
              <span className="font-medium tnum text-ink-2">{r.profile.ticker}</span>
              <span className="text-muted">{r.profile.ceo}</span>
              {r.ret && (
                <>
                  {/* The return itself stays in ink — colouring it by whether it
                      beat the index would paint Amazon's genuine +40% red. The
                      signed colour belongs on the benchmark-relative figure,
                      which is the thing the colour actually describes. */}
                  <span className="font-semibold tnum text-ink">{pct(r.ret.totalPct, 0)}</span>
                  <span
                    className="text-xs font-medium tnum"
                    style={{
                      color: r.ret.alphaPp > 0 ? "var(--color-good)" : "var(--color-critical)",
                    }}
                  >
                    {pp(r.ret.alphaPp)} vs S&P
                  </span>
                </>
              )}
            </button>
          ))}
        </Marquee>
      </div>

      {/* ------------------------------------------------ body */}
      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Dock>
            <DockItem label="Board overview" active={view === "board"} onClick={() => go("board")}>
              <LayoutGrid className="size-4" />
            </DockItem>
            <DockItem label="CEO detail" active={view === "ceo"} onClick={() => go("ceo")}>
              <Users className="size-4" />
            </DockItem>
            <DockItem label="Capital allocation" onClick={() => jumpTo("allocation", go)}>
              <Coins className="size-4" />
            </DockItem>
            <DockItem label="Acquisitions" onClick={() => jumpTo("acquisitions", go)}>
              <ShoppingBag className="size-4" />
            </DockItem>
            <DockItem label="Rankings" onClick={() => go("board")}>
              <BarChart3 className="size-4" />
            </DockItem>
          </Dock>

          {/* Roster selector */}
          <div className="flex flex-wrap gap-1.5">
            {rows.map((r) => (
              <button
                key={r.profile.id}
                onClick={() => go("ceo", r.profile.id)}
                className={
                  "rounded-full px-2.5 py-1 text-xs font-medium tnum transition-colors " +
                  (r.profile.id === selectedId && view === "ceo"
                    ? "bg-ink text-page"
                    : "bg-surface-2 text-ink-2 hairline hover:text-ink")
                }
              >
                {r.profile.ticker}
              </button>
            ))}
          </div>
        </div>

        {/* Keyed enter animation rather than AnimatePresence. `mode="wait"`
            holds the incoming view until the outgoing one finishes exiting,
            which means the swap is gated on an animation frame — and in a
            backgrounded tab, where rAF is suspended, the new view never
            mounts at all. An enter-only transition cannot deadlock. */}
        <motion.div
          key={view === "board" ? "board" : `ceo-${selectedId}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === "board" ? (
            <Overview rows={rows} selectedId={selectedId} onSelect={(id) => go("ceo", id)} />
          ) : selected ? (
            <CeoDetail row={selected} />
          ) : null}
        </motion.div>
      </main>

      <Footer rows={rows} meta={data.meta} />
    </div>
  );
}

/**
 * Switch to the CEO view, then scroll to a card inside it. The card is not in
 * the DOM until that view renders, so the scroll waits two frames — one for
 * React to commit, one for the layout to settle.
 */
function jumpTo(id: string, go: (v: View, id?: string) => void) {
  go("ceo");
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    ),
  );
}

function Booting() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted">
        <RefreshCw className="size-4 animate-spin" />
        Loading filings…
      </div>
    </div>
  );
}

function Footer({ rows, meta }: { rows: Derived[]; meta: MetaFile | null }) {
  const cached = [...(meta?.financials.cached ?? []), ...(meta?.prices.cached ?? [])];
  const failed = [...(meta?.financials.failed ?? []), ...(meta?.prices.failed ?? [])];

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-4 py-10 text-xs leading-relaxed text-muted sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-ink-2">What is measured</p>
            <p className="mt-2">
              Capital allocation is cash actually paid, taken from the cash-flow statement in each
              company's own 10-K via SEC EDGAR's XBRL API. Returns are split-adjusted monthly
              closes — <strong className="font-medium text-ink-2">price return, not total
              return</strong>. Dividends are counted as cash out, not as return reinvested.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink-2">What is hand-checked</p>
            <p className="mt-2">
              Tenure dates, named acquisitions and Summary Compensation Table totals are not
              machine-readable from XBRL, so they are authored in{" "}
              <code className="text-ink-2">src/data/roster.ts</code> with a source link and a
              verification date on every record.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink-2">Freshness</p>
            <p className="mt-2">
              {meta?.generatedAt ? `Last sync ${fmtDate(meta.generatedAt)}.` : "No sync recorded."}{" "}
              A scheduled job re-runs the pipeline on the 1st and 15th of each month.
            </p>
            {cached.length > 0 && (
              <p className="mt-2" style={{ color: "var(--color-warning)" }}>
                Served from cache: {cached.join(", ")}.
              </p>
            )}
            {failed.length > 0 && (
              <p className="mt-2" style={{ color: "var(--color-critical)" }}>
                No data: {failed.join(", ")}.
              </p>
            )}
          </div>
        </div>
        <p className="mt-8 border-t border-hairline pt-6">
          {rows.length} chief executives. Not investment advice, and deliberately not a valuation
          model — every figure here is a historical fact with a filing behind it.
        </p>
      </div>
    </footer>
  );
}
