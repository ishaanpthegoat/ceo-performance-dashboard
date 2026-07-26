# Chief — CEO Performance Dashboard

Twelve mega-cap chief executives, measured on the things that leave a paper trail: **tenure**,
**shareholder returns**, **capital allocation**, **acquisitions**, **buybacks** and **executive
compensation**. React + TypeScript, rebuilt from SEC filings every two weeks.

```bash
npm install
npm run sync     # pull filings + prices into public/data
npm run dev      # http://localhost:5173
```

---

## What the numbers actually are

This matters more than the charts, so it goes first.

### Fetched automatically — SEC EDGAR XBRL

Buybacks, dividends, capex, acquisition spend, operating cash flow, revenue, net income and R&D
come from each company's own cash-flow and income statements via the
[`companyfacts`](https://data.sec.gov/api/xbrl/companyfacts/) API. These are **cash actually paid**,
as most recently restated. Nothing is modelled or estimated.

Filers tag inconsistently — Apple reports dividends under `PaymentsOfDividendsCommonStock` in older
10-Ks and `PaymentsOfDividends` in recent ones; banks tag capex differently or not at all. The sync
script walks a preference-ordered list of tags per metric and lets later tags fill only the years
earlier ones don't cover. A blank in the UI means *the company did not report that line*, never
"zero".

### Fetched automatically — price history

Split-adjusted monthly closes from Nasdaq's public quote API, with Yahoo Finance as fallback.

**These are price returns, not total returns.** The free quote APIs expose split-adjusted closes but
only *un-adjusted* dividend amounts — Apple's 2016 dividend is listed at its pre-2020-split value
alongside post-split closes. Combining them silently corrupts the series, so this project doesn't.
Dividends appear instead on the capital-allocation side as real cash paid, from XBRL. Every return
figure in the UI is labelled accordingly.

**Price history reaches back ~10 years.** That is the provider's cap. For CEOs appointed inside that
window — Pichai, Jassy, Iger's second stint, Sarandos, Vachris — "return in post" is literally that.
For the longer-serving ones it is the trailing window, and the UI says so on the tile and in the
chart footnote rather than implying Jensen Huang's 143× arrived since 1993.

Benchmark is SPY, measured over the identical months.

### Hand-authored — [`src/data/roster.ts`](src/data/roster.ts)

Tenure dates, named acquisitions with deal values and outcomes, and Summary Compensation Table
totals are **not** machine-readable from XBRL — they live in DEF 14A prose. They are authored by
hand, and every record carries a `source` link to the company's EDGAR proxy filings and a
`verifiedAsOf` date. Compensation rows that are distorted by a one-off carry a `note` that surfaces
in the chart tooltip, because a chart of Pichai's totals is meaningless without knowing 2022 was a
triennial grant.

To add a company: append a `CeoProfile` to `ROSTER` with its SEC CIK, then run `npm run sync`.

### Deliberately not computed

Market-cap deltas and "value created" figures, which need a share-count history this project doesn't
hold. JPMorgan's payout ratio is suppressed rather than printed — a bank's operating cash flow moves
with its trading and loan books (JPM posted **−$147.8B** in FY2025), so a ratio built on that
denominator is noise.

---

## Biweekly updates

[`.github/workflows/sync.yml`](.github/workflows/sync.yml) runs on the **1st and 15th at 09:00 UTC**.
It re-fetches everything, sanity-checks the result, confirms the app still builds, and commits only
if the data changed.

Cron has no "every two weeks" — and `*/14` on day-of-month fires on the 1st, 15th *and* 29th before
resetting — so the two days are named explicitly.

The pipeline is **fail-soft**, which is the only sane design for an unattended job: if a provider is
down, the previously committed JSON is kept and flagged, `meta.json` records which symbols were
served from cache, and the dashboard footer tells the reader. A workflow step then fails the run if
the output is degenerate, so a bad fetch can never overwrite good data with an empty file.

Trigger a run by hand from the Actions tab, or locally:

```bash
npm run sync                # everything
npm run sync:financials     # SEC only
npm run sync:prices         # prices only
```

Set a `SEC_CONTACT` repository variable to your own email — SEC asks for a contact address in the
User-Agent of automated requests.

---

## The component library

Eighteen components in the 21st.dev idiom — self-contained files, typed props, Tailwind against CSS
custom properties, Framer Motion for movement. Each one is copy-pasteable into another project.
See [`src/components/ui/`](src/components/ui/).

| # | Component | What it does |
|---|-----------|--------------|
| 01 | `AuroraBackground` | Drifting conic colour field behind the hero |
| 02 | `SpotlightCard` | Pointer-tracking border and surface highlight |
| 03 | `BentoGrid` / `BentoCard` | Asymmetric 12-column dashboard grid |
| 04 | `NumberTicker` | Spring-counted figures on scroll-in |
| 05 | `Marquee` | Seamless infinite scroller, pauses on hover |
| 06 | `BorderBeam` | Light travelling a rounded border via `offset-path` |
| 07 | `MagneticButton` | Leans toward the cursor, springs back |
| 08 | `AnimatedTabs` | `layoutId` sliding pill, full tablist keyboard contract |
| 09 | `Timeline` | Vertical spine that fills with scroll progress |
| 10 | `TextShimmer` | Highlight sweep across glyphs, text stays selectable |
| 11 | `Dock` / `DockItem` | macOS-style magnifying dock |
| 12 | `AnimatedTooltip` | Spring tooltip that tilts toward the pointer |
| 13 | `CommandPalette` | ⌘K combobox search over CEOs and views |
| 14 | `ScrollProgress` | Spring-damped reading-progress hairline |
| 15 | `Meteors` | Falling streak field |
| 16 | `TiltCard` | 3D perspective tilt with specular glare |
| 17 | `AnimatedList` | Staggered reveal driven by parent variants |
| 18 | `DotPattern` | Masked tiling dot grid |

Two implementation notes worth keeping if you copy these:

- **Reveal animations never gate visibility.** `whileInView` + `once: true` has a real failure mode:
  if the element is never observed intersecting — a deep link that lands below it, a restored scroll
  position, a backgrounded tab whose `requestAnimationFrame` is suspended — it keeps its `initial`
  state, and `initial` is `opacity: 0`. The content is in the DOM and simply cannot be seen.
  [`useReveal`](src/lib/use-reveal.ts) observes as usual but also starts a timer; whichever fires
  first reveals permanently.
- **`NumberTicker` renders its final value as initial content**, not zero, so the correct figure is
  what sits in the DOM for a screen reader, a crawler, or anything that never trips the observer.

---

## Charts

Built to a single colour and mark discipline, not per-chart taste:

- **Never a dual axis.** Company and benchmark are indexed to 100 at the window start so both sit
  on one honest scale. A log toggle exists because NVIDIA's 143× flattens everything else.
- **Categorical hues in fixed validated order**, never cycled. The four-slot allocation sequence
  clears the colour-vision-deficiency and normal-vision separation gates in both light and dark.
- **Scatter is single-series** by construction. Scatter is judged on all colour pairs rather than
  adjacent ones, which caps a palette at three slots — so every CEO is one hue and the selected one
  is promoted, rather than twelve hues that would fail the gate and help nobody.
- **Text never wears the series colour.** Identity comes from a swatch beside the label; the label
  uses ink tokens.
- **2px surface gaps** separate stacked segments, never a stroke around the mark.
- **The allocation chart ships a table view.** Two of the four light-mode series sit below 3:1
  against the light surface, which obliges either a visible label on every segment — unreadable at
  this density — or a table. So, a table.

Dark and light are both *selected* palettes: the dark steps are the same eight hues re-stepped for
the dark surface, not an automatic inversion.

---

## Layout

```
scripts/sync.mjs          the data pipeline (SEC + prices, fail-soft)
src/data/roster.ts        hand-authored tenure, deals, compensation
src/lib/metrics.ts        joins roster to fetched data; all derived numbers
src/lib/use-reveal.ts     scroll reveal that can't strand content invisible
src/components/ui/        the 18-component library
src/components/charts/    chart implementations + shared furniture
src/views/                board overview and CEO detail
public/data/              generated — do not hand-edit
```

Deep links work: `#/ceo/avgo` opens Hock Tan directly, and the back button behaves.

---

## Deploying

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds and publishes to GitHub Pages on
every push to `main`. Enable it under **Settings → Pages → Source → GitHub Actions**. The build sets
`VITE_BASE` so asset paths resolve under `/<repo>/`.

---

Not investment advice, and deliberately not a valuation model. Every figure is a historical fact
with a filing behind it.
