#!/usr/bin/env node
/**
 * Rebuilds the machine-readable half of the dataset into public/data/.
 *
 *   financials.json  capital allocation per fiscal year, from SEC EDGAR XBRL
 *   prices.json      split-adjusted monthly closes, from a public quote API
 *   meta.json        when this ran, what succeeded, what fell back to cache
 *
 * Design constraints worth knowing before you change anything here:
 *
 * 1. FAIL-SOFT. This runs unattended on a cron. A provider being down must
 *    never produce an empty dashboard — we keep the previously committed JSON
 *    and mark it stale so the UI can say so. Only a hard schema error exits
 *    non-zero.
 * 2. SEC asks for a descriptive User-Agent and no more than 10 req/s. We send
 *    a real contact address and stay far below the limit.
 * 3. Prices are PRICE RETURN, split-adjusted, EXCLUDING dividends. The free
 *    quote APIs expose split-adjusted closes but only un-adjusted dividend
 *    amounts, and mixing the two silently corrupts a total-return series. So
 *    we don't. Dividends show up on the capital-allocation side as actual cash
 *    paid, straight from XBRL, and the UI labels the return charts honestly.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "data");

const CONTACT = process.env.SEC_CONTACT ?? "ceo-dashboard ishaan.pemmaraju.9@gmail.com";
const SEC_UA = `CEO-Performance-Dashboard/0.1 (${CONTACT})`;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Kept in sync with src/data/roster.ts by `npm run sync` reading it directly. */
const rosterSrc = await readFile(join(ROOT, "src", "data", "roster.ts"), "utf8");

function parseRoster(src) {
  // The roster is TypeScript, and this script is plain node. Rather than pull
  // in a transpiler for six fields, pick them out of the source. Regex over
  // your own repo's generated-adjacent file is fine; regex over someone
  // else's HTML is not.
  const out = [];
  const re =
    /id:\s*"([^"]+)",\s*\n\s*ticker:\s*"([^"]+)",\s*\n\s*cik:\s*"([^"]+)",\s*\n\s*company:\s*"([^"]+)"[\s\S]*?start:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ id: m[1], ticker: m[2], cik: m[3], company: m[4], start: m[5] });
  }
  if (!out.length) throw new Error("roster parse produced zero companies — did the shape of roster.ts change?");
  return out;
}

const ROSTER = parseRoster(rosterSrc);
const BENCHMARK = { id: "benchmark", ticker: "SPY", assetClass: "etf" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** fetch with retry, exponential backoff and jitter. Returns null on give-up. */
async function get(url, { headers = {}, tries = 4, label = url, json = true } = {}) {
  let wait = 1200;
  for (let i = 1; i <= tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 45_000);
      const res = await fetch(url, { headers, signal: ctl.signal });
      clearTimeout(t);
      if (res.ok) return json ? await res.json() : await res.text();
      // 429/5xx are worth another go; 404 is not.
      if (res.status === 404) {
        console.warn(`    ${label}: 404, skipping`);
        return null;
      }
      console.warn(`    ${label}: HTTP ${res.status} (attempt ${i}/${tries})`);
    } catch (err) {
      console.warn(`    ${label}: ${err.name === "AbortError" ? "timeout" : err.message} (attempt ${i}/${tries})`);
    }
    if (i < tries) {
      await sleep(wait + Math.random() * 600);
      wait *= 2;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Capital allocation — SEC EDGAR XBRL
 * ------------------------------------------------------------------ */

/**
 * Each metric lists the us-gaap tags that can carry it, in preference order.
 * Filers are inconsistent: banks tag capex differently, some use `Revenues`
 * and some use the ASC 606 tag, dividend payments split into common/preferred.
 * We take the first tag that yields a value for the period.
 */
const CONCEPTS = {
  buybacks: ["PaymentsForRepurchaseOfCommonStock", "PaymentsForRepurchaseOfEquity"],
  dividends: [
    "PaymentsOfDividendsCommonStock",
    "PaymentsOfDividends",
    "PaymentsOfDividendsMinorityInterest",
  ],
  acquisitions: [
    "PaymentsToAcquireBusinessesNetOfCashAcquired",
    "PaymentsToAcquireBusinessesGross",
    "PaymentsToAcquireBusinessesAndInterestInAffiliates",
  ],
  capex: [
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "PaymentsToAcquireProductiveAssets",
    "PaymentsForCapitalImprovements",
  ],
  operatingCashFlow: [
    "NetCashProvidedByUsedInOperatingActivities",
    "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
  ],
  revenue: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"],
  netIncome: ["NetIncomeLoss"],
  rnd: ["ResearchAndDevelopmentExpense"],
};

/** Roughly a fiscal year? XBRL durations wobble by a few days. */
const isAnnual = (d) => d >= 330 && d <= 400;
const days = (a, b) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

/**
 * Pull one annual value per fiscal year out of a companyfacts unit array.
 *
 * The same fiscal year appears many times — restated in later filings, in
 * different forms, over slightly different windows. We keep 10-K annual
 * periods and, for each fiscal year, the observation from the most recently
 * *filed* report, which is the restated-latest view.
 */
function annualByFY(units) {
  const best = new Map();
  for (const u of units ?? []) {
    if (!u.start || !u.end || u.val == null) continue;
    if (!isAnnual(days(u.start, u.end))) continue;
    if (u.form !== "10-K" && u.form !== "10-K/A" && u.form !== "20-F") continue;
    // Key on the period end year, not u.fy — u.fy is the year of the *filing*
    // that reported it, so a 10-K carries three different u.fy values for the
    // same three fiscal years.
    const year = new Date(u.end).getUTCFullYear();
    const prev = best.get(year);
    if (!prev || Date.parse(u.filed) > Date.parse(prev.filed)) {
      best.set(year, { val: u.val, filed: u.filed, start: u.start, end: u.end, form: u.form });
    }
  }
  return best;
}

async function fetchFinancials(company) {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`;
  const facts = await get(url, {
    headers: { "User-Agent": SEC_UA, Accept: "application/json" },
    label: `${company.ticker} companyfacts`,
  });
  if (!facts?.facts?.["us-gaap"]) return null;

  const gaap = facts.facts["us-gaap"];
  const series = {};
  const tagsUsed = {};

  for (const [metric, candidates] of Object.entries(CONCEPTS)) {
    // Walk every candidate tag in preference order rather than stopping at the
    // first one that exists. Filers switch tags mid-history — Apple reports
    // dividends under PaymentsOfDividendsCommonStock in older 10-Ks and
    // PaymentsOfDividends in recent ones — so a tag that covers 2013–2019 must
    // not shadow the tag that covers 2020–2025. First tag wins per year;
    // later tags only fill years still empty.
    for (const tag of candidates) {
      const units = gaap[tag]?.units?.USD;
      if (!units) continue;
      const byYear = annualByFY(units);
      if (!byYear.size) continue;
      let contributed = false;
      for (const [year, obs] of byYear) {
        series[year] ??= { fy: year };
        if (series[year][metric] == null) {
          series[year][metric] = obs.val;
          series[year][`_end_${metric}`] = obs.end;
          contributed = true;
        }
      }
      if (contributed) tagsUsed[metric] = tagsUsed[metric] ? `${tagsUsed[metric]}, ${tag}` : tag;
    }
  }

  const years = Object.keys(series)
    .map(Number)
    .sort((a, b) => a - b)
    .map((y) => {
      const r = series[y];
      const fiscalEnd = r[`_end_operatingCashFlow`] ?? r[`_end_revenue`] ?? `${y}-12-31`;
      for (const k of Object.keys(r)) if (k.startsWith("_end_")) delete r[k];
      return { ...r, fiscalEnd };
    });

  return {
    entityName: facts.entityName,
    cik: company.cik,
    tagsUsed,
    years,
  };
}

/* ------------------------------------------------------------------ *
 * Prices — split-adjusted monthly closes
 * ------------------------------------------------------------------ */

const money = (s) => {
  const n = Number(String(s).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Nasdaq's public quote API. Split-adjusted closes, ~10 years deep. */
async function fromNasdaq(ticker, assetClass) {
  const sym = encodeURIComponent(ticker.replace("-", "/"));
  const to = new Date().toISOString().slice(0, 10);
  const url =
    `https://api.nasdaq.com/api/quote/${sym}/historical` +
    `?assetclass=${assetClass}&fromdate=1990-01-01&todate=${to}&limit=20000`;
  const j = await get(url, {
    headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
    label: `${ticker} nasdaq`,
  });
  const rows = j?.data?.tradesTable?.rows;
  if (!rows?.length) return null;
  const out = [];
  for (const r of rows) {
    const [mm, dd, yyyy] = r.date.split("/");
    const close = money(r.close);
    if (close == null) continue;
    out.push({ date: `${yyyy}-${mm}-${dd}`, close });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out.length ? { source: "nasdaq", daily: out } : null;
}

/** Yahoo's chart endpoint. adjclose reaches further back when Nasdaq caps out. */
async function fromYahoo(ticker) {
  const sym = encodeURIComponent(ticker.replace("/", "-"));
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=40y&interval=1mo`;
  const j = await get(url, {
    headers: { "User-Agent": BROWSER_UA, Accept: "application/json" },
    label: `${ticker} yahoo`,
    tries: 2,
  });
  const r = j?.chart?.result?.[0];
  const ts = r?.timestamp;
  const ac = r?.indicators?.adjclose?.[0]?.adjclose ?? r?.indicators?.quote?.[0]?.close;
  if (!ts?.length || !ac?.length) return null;
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    if (ac[i] == null) continue;
    out.push({ date: new Date(ts[i] * 1000).toISOString().slice(0, 10), close: ac[i] });
  }
  return out.length ? { source: "yahoo", daily: out } : null;
}

/** Collapse a daily series to one point per month (last trading day). */
function toMonthly(daily) {
  const byMonth = new Map();
  for (const p of daily) byMonth.set(p.date.slice(0, 7), p);
  return [...byMonth.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchPrices(ticker, assetClass = "stocks") {
  // Nasdaq first: it is the more reliable of the two from most IPs, and its
  // closes are cleanly split-adjusted. Yahoo is the deeper-history fallback.
  const res = (await fromNasdaq(ticker, assetClass)) ?? (await fromYahoo(ticker));
  if (!res) return null;
  const monthly = toMonthly(res.daily);
  const last = res.daily[res.daily.length - 1];
  return {
    source: res.source,
    /** Price return only — see the header note. */
    basis: "split-adjusted close, excludes dividends",
    first: monthly[0]?.date ?? null,
    last: last?.date ?? null,
    latestClose: last?.close ?? null,
    monthly,
  };
}

/* ------------------------------------------------------------------ *
 * Runner
 * ------------------------------------------------------------------ */

async function readCache(name) {
  try {
    return JSON.parse(await readFile(join(OUT, name), "utf8"));
  } catch {
    return null;
  }
}

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const wantFinancials = !only || only === "financials";
const wantPrices = !only || only === "prices";

await mkdir(OUT, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  financials: { ok: [], cached: [], failed: [] },
  prices: { ok: [], cached: [], failed: [] },
};

/* --- financials --- */
if (wantFinancials) {
  console.log(`\nSEC EDGAR — capital allocation for ${ROSTER.length} filers`);
  const cache = await readCache("financials.json");
  const out = {};
  for (const c of ROSTER) {
    process.stdout.write(`  ${c.ticker.padEnd(6)} `);
    const got = await fetchFinancials(c);
    if (got) {
      out[c.id] = got;
      report.financials.ok.push(c.ticker);
      const yrs = got.years.length;
      const latest = got.years[yrs - 1];
      console.log(`${yrs} fiscal years → ${latest.fy}`);
    } else if (cache?.companies?.[c.id]) {
      out[c.id] = cache.companies[c.id];
      report.financials.cached.push(c.ticker);
      console.log(`FAILED — keeping cached copy`);
    } else {
      report.financials.failed.push(c.ticker);
      console.log(`FAILED — no cache available`);
    }
    await sleep(350); // stay well inside SEC's rate limit
  }
  await writeFile(
    join(OUT, "financials.json"),
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        source: "SEC EDGAR XBRL companyfacts",
        note: "Cash-flow-statement values as most recently restated. Currency USD.",
        companies: out,
      },
      null,
      1,
    ) + "\n",
  );
}

/* --- prices --- */
if (wantPrices) {
  const targets = [...ROSTER.map((c) => ({ ...c, assetClass: "stocks" })), BENCHMARK];
  console.log(`\nPrice history — ${targets.length} symbols`);
  const cache = await readCache("prices.json");
  const out = {};
  for (const t of targets) {
    process.stdout.write(`  ${t.ticker.padEnd(6)} `);
    const got = await fetchPrices(t.ticker, t.assetClass ?? "stocks");
    if (got) {
      out[t.id] = { ticker: t.ticker, ...got };
      report.prices.ok.push(t.ticker);
      console.log(`${got.monthly.length} months ${got.first} → ${got.last} (${got.source})`);
    } else if (cache?.symbols?.[t.id]) {
      out[t.id] = cache.symbols[t.id];
      report.prices.cached.push(t.ticker);
      console.log(`FAILED — keeping cached copy`);
    } else {
      report.prices.failed.push(t.ticker);
      console.log(`FAILED — no cache available`);
    }
    await sleep(900); // these APIs throttle harder than SEC does
  }
  await writeFile(
    join(OUT, "prices.json"),
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        note: "Monthly split-adjusted closes. PRICE RETURN — excludes dividends. See scripts/sync.mjs.",
        symbols: out,
      },
      null,
      1,
    ) + "\n",
  );
}

await writeFile(join(OUT, "meta.json"), JSON.stringify(report, null, 1) + "\n");

const f = report.financials;
const p = report.prices;
console.log(
  `\nfinancials  ok ${f.ok.length}  cached ${f.cached.length}  failed ${f.failed.length}` +
    `\nprices      ok ${p.ok.length}  cached ${p.cached.length}  failed ${p.failed.length}`,
);
if (f.failed.length || p.failed.length) {
  console.log(
    `\nSome symbols have no data and no cache: ${[...f.failed, ...p.failed].join(", ")}.` +
      `\nThe dashboard degrades gracefully; re-run \`npm run sync\` to fill them in.`,
  );
}
console.log(`\nwrote public/data/{financials,prices,meta}.json`);
