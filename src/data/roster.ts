/**
 * Curated roster — the human-authored half of the dataset.
 *
 * Everything in this file is a fact that is NOT machine-readable from SEC XBRL:
 * who runs the company, when they started, what they were paid (Summary
 * Compensation Table totals live in DEF 14A prose, not in the XBRL financial
 * facts), and which acquisitions actually mattered.
 *
 * The other half — cash actually spent on buybacks, dividends, capex and
 * acquisitions — is pulled from SEC EDGAR by `scripts/sync.mjs` and lands in
 * `public/data/financials.json`. Nothing in this file duplicates that.
 *
 * Every record carries `verifiedAsOf` and a `source` so a reader can check it.
 * If you extend the roster, keep that contract.
 */

export type CompRow = {
  /** Fiscal year the Summary Compensation Table row covers. */
  fy: number;
  /** SCT "Total" in USD. */
  total: number;
  salary: number;
  /** Stock + option awards at grant-date fair value. */
  equity: number;
  /** Non-equity incentive plan compensation (cash bonus). */
  bonus: number;
  /** All other compensation — security, aircraft, benefits. */
  other: number;
  /** Set when the number is distorted by a one-off and needs a footnote. */
  note?: string;
};

export type Acquisition = {
  name: string;
  /** Announcement year. */
  year: number;
  /** Headline value in USD. Null when never disclosed. */
  value: number | null;
  status: "closed" | "terminated" | "blocked" | "pending";
  /** One line on why it mattered. */
  rationale: string;
};

export type CeoProfile = {
  id: string;
  ticker: string;
  /** Zero-padded 10-digit SEC CIK. */
  cik: string;
  company: string;
  sector: string;
  ceo: string;
  /** ISO date the CEO took the top job. */
  start: string;
  /** Set when the CEO has since left. */
  end?: string;
  /** Prior stint, for returning CEOs like Iger. */
  priorTenure?: { start: string; end: string };
  /** True when the CEO founded or co-founded the company. */
  founder: boolean;
  /** Short characterisation of the capital-allocation stance. */
  doctrine: string;
  compensation: CompRow[];
  acquisitions: Acquisition[];
  /** Where a reader can verify the compensation and tenure claims. */
  source: string;
  verifiedAsOf: string;
};

const VERIFIED = "2026-07-26";

export const ROSTER: CeoProfile[] = [
  {
    id: "aapl",
    ticker: "AAPL",
    cik: "0000320193",
    company: "Apple",
    sector: "Consumer Tech",
    ceo: "Tim Cook",
    start: "2011-08-24",
    founder: false,
    doctrine:
      "Return nearly all free cash flow. The largest buyback programme in corporate history, paired with deliberately small acquisitions.",
    compensation: [
      { fy: 2020, total: 14_769_259, salary: 3_000_000, equity: 0, bonus: 10_735_000, other: 1_034_259, note: "No new equity granted; the 2011 grant vested out." },
      { fy: 2021, total: 98_734_394, salary: 3_000_000, equity: 82_347_835, bonus: 12_000_000, other: 1_386_559, note: "First new equity award since 2011." },
      { fy: 2022, total: 99_420_097, salary: 3_000_000, equity: 82_969_915, bonus: 12_000_000, other: 1_450_182 },
      { fy: 2023, total: 63_209_845, salary: 3_000_000, equity: 46_970_283, bonus: 10_713_450, other: 2_526_112, note: "Target equity cut ~40% at Cook's own request after a say-on-pay protest." },
      { fy: 2024, total: 74_610_296, salary: 3_000_000, equity: 58_090_000, bonus: 12_000_000, other: 1_520_296 },
    ],
    acquisitions: [
      { name: "Beats Electronics", year: 2014, value: 3_000_000_000, status: "closed", rationale: "Largest deal Apple has ever done; seeded Apple Music." },
      { name: "Intel smartphone modem unit", year: 2019, value: 1_000_000_000, status: "closed", rationale: "Bought 2,200 engineers and a patent stack to end Qualcomm dependence." },
      { name: "Shazam", year: 2018, value: 400_000_000, status: "closed", rationale: "Music recognition folded into Siri and Apple Music." },
      { name: "Primephonic", year: 2021, value: null, status: "closed", rationale: "Classical catalogue and metadata behind Apple Music Classical." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000320193&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "msft",
    ticker: "MSFT",
    cik: "0000789019",
    company: "Microsoft",
    sector: "Enterprise Software",
    ceo: "Satya Nadella",
    start: "2014-02-04",
    founder: false,
    doctrine:
      "Buy the platform, then buy the distribution. Three deals over $19B while still running a steady buyback and a growing dividend.",
    compensation: [
      { fy: 2020, total: 44_321_788, salary: 2_500_000, equity: 30_923_074, bonus: 10_800_000, other: 98_714 },
      { fy: 2021, total: 49_858_280, salary: 2_500_000, equity: 33_090_960, bonus: 14_200_000, other: 67_320 },
      { fy: 2022, total: 54_945_434, salary: 2_500_000, equity: 37_216_320, bonus: 15_150_000, other: 79_114 },
      { fy: 2023, total: 48_512_923, salary: 2_500_000, equity: 39_222_635, bonus: 6_700_000, other: 90_288, note: "Cash incentive cut ~50% at Nadella's request following the year's security incidents." },
      { fy: 2024, total: 79_106_183, salary: 2_500_000, equity: 71_236_853, bonus: 5_200_000, other: 169_330, note: "Equity figure reflects a change in grant timing, not a doubling of target pay." },
    ],
    acquisitions: [
      { name: "Activision Blizzard", year: 2023, value: 68_700_000_000, status: "closed", rationale: "Largest deal in Microsoft history; Game Pass content moat." },
      { name: "LinkedIn", year: 2016, value: 26_200_000_000, status: "closed", rationale: "The professional graph — data no competitor could rebuild." },
      { name: "Nuance Communications", year: 2021, value: 19_700_000_000, status: "closed", rationale: "Healthcare AI and clinical voice, wedged into Azure." },
      { name: "ZeniMax / Bethesda", year: 2020, value: 7_500_000_000, status: "closed", rationale: "First-party studios ahead of the Activision bid." },
      { name: "GitHub", year: 2018, value: 7_500_000_000, status: "closed", rationale: "Owned the developer workflow; the substrate for Copilot." },
      { name: "Mojang / Minecraft", year: 2014, value: 2_500_000_000, status: "closed", rationale: "Nadella's first major deal, six months into the job." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000789019&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "nvda",
    ticker: "NVDA",
    cik: "0001045810",
    company: "NVIDIA",
    sector: "Semiconductors",
    ceo: "Jensen Huang",
    start: "1993-04-05",
    founder: true,
    doctrine:
      "Longest-tenured founder-CEO in mega-cap tech. Reinvest in the platform, acquire rarely, and buy back stock only once the cash pile became absurd.",
    compensation: [
      { fy: 2021, total: 19_306_294, salary: 996_154, equity: 15_890_000, bonus: 2_400_000, other: 20_140 },
      { fy: 2022, total: 23_735_781, salary: 1_000_000, equity: 19_672_000, bonus: 3_040_000, other: 23_781 },
      { fy: 2023, total: 21_356_105, salary: 996_154, equity: 19_912_000, bonus: 405_000, other: 42_951, note: "Bonus collapsed with the FY23 gaming downturn — the year before the AI re-rating." },
      { fy: 2024, total: 34_167_060, salary: 996_154, equity: 26_675_000, bonus: 6_000_000, other: 495_906 },
      { fy: 2025, total: 49_866_251, salary: 1_500_000, equity: 38_819_000, bonus: 8_000_000, other: 1_547_251, note: "Includes a step-up in personal security costs." },
    ],
    acquisitions: [
      { name: "Arm Holdings", year: 2020, value: 40_000_000_000, status: "terminated", rationale: "Abandoned in 2022 under regulatory pressure; NVIDIA kept a $1.25B breakup fee paid to SoftBank." },
      { name: "Mellanox Technologies", year: 2019, value: 6_900_000_000, status: "closed", rationale: "InfiniBand networking — arguably the highest-ROI deal of the AI build-out." },
      { name: "Run:ai", year: 2024, value: 700_000_000, status: "closed", rationale: "GPU orchestration for Kubernetes; open-sourced post-close." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "googl",
    ticker: "GOOGL",
    cik: "0001652044",
    company: "Alphabet",
    sector: "Internet",
    ceo: "Sundar Pichai",
    start: "2019-12-03",
    founder: false,
    doctrine:
      "Took a company that had never paid a dividend and started one. Pay arrives in a lumpy triennial equity grant, which makes the comp chart look broken when it isn't.",
    compensation: [
      { fy: 2020, total: 7_425_547, salary: 2_000_000, equity: 0, bonus: 0, other: 5_425_547, note: "Off-cycle year — no new equity grant." },
      { fy: 2021, total: 6_317_697, salary: 2_000_000, equity: 0, bonus: 0, other: 4_317_697, note: "Off-cycle year — no new equity grant." },
      { fy: 2022, total: 225_985_000, salary: 2_000_000, equity: 218_000_000, bonus: 0, other: 5_985_000, note: "Triennial grant year. Vests 2023–2025; not annual pay." },
      { fy: 2023, total: 8_802_824, salary: 2_000_000, equity: 0, bonus: 0, other: 6_802_824, note: "Off-cycle year. 'Other' is dominated by personal security." },
      { fy: 2024, total: 10_734_000, salary: 2_000_000, equity: 0, bonus: 0, other: 8_734_000, note: "Off-cycle year." },
    ],
    acquisitions: [
      { name: "Wiz", year: 2025, value: 32_000_000_000, status: "pending", rationale: "Largest deal in Alphabet history; cloud security to close the gap on Microsoft." },
      { name: "Mandiant", year: 2022, value: 5_400_000_000, status: "closed", rationale: "Incident response and threat intel for Google Cloud." },
      { name: "Looker", year: 2019, value: 2_600_000_000, status: "closed", rationale: "BI layer on BigQuery." },
      { name: "Fitbit", year: 2019, value: 2_100_000_000, status: "closed", rationale: "Wearables hardware and health data; closed 2021 with EU conditions." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001652044&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "amzn",
    ticker: "AMZN",
    cik: "0001018724",
    company: "Amazon",
    sector: "E-commerce / Cloud",
    ceo: "Andy Jassy",
    start: "2021-07-05",
    founder: false,
    doctrine:
      "Inherited the anti-dividend house religion and kept it. Every dollar goes into capex — the largest capital programme of any company on this board.",
    compensation: [
      { fy: 2021, total: 212_701_169, salary: 175_000, equity: 211_933_620, bonus: 0, other: 592_549, note: "One-time 10-year RSU grant on promotion. Vests through 2031." },
      { fy: 2022, total: 1_298_845, salary: 317_500, equity: 0, bonus: 0, other: 981_345, note: "No new equity — the 2021 grant covers the decade." },
      { fy: 2023, total: 1_400_222, salary: 365_000, equity: 0, bonus: 0, other: 1_035_222 },
      { fy: 2024, total: 1_618_351, salary: 365_000, equity: 0, bonus: 0, other: 1_253_351, note: "'Other' is almost entirely personal security." },
    ],
    acquisitions: [
      { name: "MGM Holdings", year: 2021, value: 8_500_000_000, status: "closed", rationale: "Catalogue and Bond; Jassy's first big swing, closed months into the job." },
      { name: "One Medical", year: 2022, value: 3_900_000_000, status: "closed", rationale: "Primary-care clinics bolted onto Amazon Health." },
      { name: "iRobot", year: 2022, value: 1_700_000_000, status: "terminated", rationale: "Abandoned 2024 on EU opposition; Amazon paid a $94M termination fee." },
      { name: "Zoox", year: 2020, value: 1_300_000_000, status: "closed", rationale: "Autonomous robotaxi platform, still pre-revenue." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001018724&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "meta",
    ticker: "META",
    cik: "0001326801",
    company: "Meta Platforms",
    sector: "Internet",
    ceo: "Mark Zuckerberg",
    start: "2004-02-04",
    founder: true,
    doctrine:
      "Controls the vote, takes $1 in salary, and has run one of the most aggressive buybacks in tech alongside a capex ramp that spooked the market twice.",
    compensation: [
      { fy: 2020, total: 25_292_692, salary: 1, equity: 0, bonus: 0, other: 25_292_691, note: "$1 salary. 'Other' is security and private aircraft." },
      { fy: 2021, total: 26_819_012, salary: 1, equity: 0, bonus: 0, other: 26_819_011 },
      { fy: 2022, total: 27_111_675, salary: 1, equity: 0, bonus: 0, other: 27_111_674 },
      { fy: 2023, total: 24_400_000, salary: 1, equity: 0, bonus: 0, other: 24_399_999 },
      { fy: 2024, total: 27_200_000, salary: 1, equity: 0, bonus: 0, other: 27_199_999, note: "Security allowance raised to $14M in 2024." },
    ],
    acquisitions: [
      { name: "WhatsApp", year: 2014, value: 19_000_000_000, status: "closed", rationale: "3B users. The deal the FTC spent a decade trying to unwind." },
      { name: "Scale AI (49% stake)", year: 2025, value: 14_300_000_000, status: "closed", rationale: "Structured as a minority investment to sidestep merger review; brought in the founder to run superintelligence work." },
      { name: "Oculus VR", year: 2014, value: 2_000_000_000, status: "closed", rationale: "The seed of Reality Labs and roughly $60B of cumulative operating losses." },
      { name: "Instagram", year: 2012, value: 1_000_000_000, status: "closed", rationale: "Widely held to be the best price ever paid for a consumer app." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001326801&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "tsla",
    ticker: "TSLA",
    cik: "0001318605",
    company: "Tesla",
    sector: "Automotive / Energy",
    ceo: "Elon Musk",
    start: "2008-10-01",
    founder: false,
    doctrine:
      "No dividend, no buyback, no salary. All compensation is a single options mega-grant, and the courts have been arguing about it since 2018.",
    compensation: [
      { fy: 2020, total: 0, salary: 0, equity: 0, bonus: 0, other: 0, note: "Musk accepts no salary; the 2018 grant was expensed in prior years." },
      { fy: 2021, total: 0, salary: 0, equity: 0, bonus: 0, other: 0 },
      { fy: 2022, total: 0, salary: 0, equity: 0, bonus: 0, other: 0 },
      { fy: 2023, total: 0, salary: 0, equity: 0, bonus: 0, other: 0, note: "Delaware rescinded the 2018 award in Tornetta v. Musk (Jan 2024)." },
      { fy: 2024, total: 0, salary: 0, equity: 0, bonus: 0, other: 0, note: "SCT total remains $0. The 2025 CEO Performance Award, ratified by shareholders in Nov 2025, is worth up to ~$1T against 2035 milestones and is not yet an SCT figure." },
    ],
    acquisitions: [
      { name: "SolarCity", year: 2016, value: 2_600_000_000, status: "closed", rationale: "Related-party deal that survived a Delaware challenge; became Tesla Energy." },
      { name: "Maxwell Technologies", year: 2019, value: 218_000_000, status: "closed", rationale: "Dry-electrode cell tech behind the 4680." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001318605&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "jpm",
    ticker: "JPM",
    cik: "0000019617",
    company: "JPMorgan Chase",
    sector: "Banking",
    ceo: "Jamie Dimon",
    start: "2005-12-31",
    founder: false,
    doctrine:
      "Twenty years in the chair. Buys banks when they are on fire and everyone else is out of balance sheet — Bear, WaMu, First Republic.",
    compensation: [
      { fy: 2020, total: 31_664_998, salary: 1_500_000, equity: 25_000_000, bonus: 5_000_000, other: 164_998 },
      { fy: 2021, total: 84_400_000, salary: 1_500_000, equity: 77_900_000, bonus: 5_000_000, other: 0, note: "Includes a one-off 1.5M-share retention option grant, exercisable 2026." },
      { fy: 2022, total: 34_500_000, salary: 1_500_000, equity: 28_000_000, bonus: 5_000_000, other: 0 },
      { fy: 2023, total: 36_000_000, salary: 1_500_000, equity: 29_500_000, bonus: 5_000_000, other: 0 },
      { fy: 2024, total: 39_000_000, salary: 1_500_000, equity: 32_500_000, bonus: 5_000_000, other: 0 },
    ],
    acquisitions: [
      { name: "First Republic Bank", year: 2023, value: 10_600_000_000, status: "closed", rationale: "FDIC-assisted; booked a $2.7B one-time gain on day one." },
      { name: "Washington Mutual", year: 2008, value: 1_900_000_000, status: "closed", rationale: "Largest bank failure in US history, bought overnight from the FDIC." },
      { name: "Bear Stearns", year: 2008, value: 1_400_000_000, status: "closed", rationale: "$2/share initially, raised to $10 — with a Fed backstop on $29B of assets." },
      { name: "InstaMed", year: 2019, value: 500_000_000, status: "closed", rationale: "Healthcare payments rails." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000019617&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "avgo",
    ticker: "AVGO",
    cik: "0001730168",
    company: "Broadcom",
    sector: "Semiconductors",
    ceo: "Hock Tan",
    start: "2006-03-01",
    founder: false,
    doctrine:
      "The purest roll-up on this board. Buy an incumbent franchise, cut R&D to the crown jewels, raise prices, service the debt, repeat.",
    compensation: [
      { fy: 2020, total: 60_700_000, salary: 1_100_000, equity: 58_500_000, bonus: 0, other: 1_100_000 },
      { fy: 2021, total: 60_700_000, salary: 1_100_000, equity: 59_100_000, bonus: 0, other: 500_000 },
      { fy: 2022, total: 60_700_000, salary: 1_100_000, equity: 59_100_000, bonus: 0, other: 500_000 },
      { fy: 2023, total: 161_800_000, salary: 1_200_000, equity: 160_000_000, bonus: 0, other: 600_000, note: "Multi-year performance grant tied to the VMware integration; among the largest single-year CEO awards ever filed." },
      { fy: 2024, total: 61_900_000, salary: 1_200_000, equity: 60_100_000, bonus: 0, other: 600_000 },
    ],
    acquisitions: [
      { name: "Qualcomm", year: 2017, value: 121_000_000_000, status: "blocked", rationale: "Blocked by presidential order on national-security grounds — the largest tech deal never done." },
      { name: "VMware", year: 2022, value: 61_000_000_000, status: "closed", rationale: "Repriced the entire enterprise virtualisation market within a year of closing." },
      { name: "CA Technologies", year: 2018, value: 18_900_000_000, status: "closed", rationale: "Mainframe software annuities — the deal that confused semiconductor analysts." },
      { name: "Symantec enterprise unit", year: 2019, value: 10_700_000_000, status: "closed", rationale: "Enterprise security seats with high renewal rates." },
      { name: "Brocade Communications", year: 2016, value: 5_900_000_000, status: "closed", rationale: "Fibre-channel switching to pair with the storage franchise." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001730168&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "nflx",
    ticker: "NFLX",
    cik: "0001065280",
    company: "Netflix",
    sector: "Streaming",
    ceo: "Ted Sarandos & Greg Peters",
    start: "2020-07-16",
    founder: false,
    doctrine:
      "Co-CEO structure. Builds content instead of buying companies, and switched from cash-burning to a very large buyback once streaming turned free-cash-flow positive.",
    compensation: [
      { fy: 2020, total: 39_300_000, salary: 12_000_000, equity: 27_300_000, bonus: 0, other: 0, note: "Sarandos only. Netflix pays a chosen salary/equity split with no bonus." },
      { fy: 2021, total: 41_700_000, salary: 20_000_000, equity: 21_700_000, bonus: 0, other: 0 },
      { fy: 2022, total: 50_300_000, salary: 20_000_000, equity: 30_300_000, bonus: 0, other: 0 },
      { fy: 2023, total: 49_800_000, salary: 3_000_000, equity: 46_800_000, bonus: 0, other: 0, note: "Structure reworked toward performance stock options." },
      { fy: 2024, total: 61_900_000, salary: 3_000_000, equity: 58_900_000, bonus: 0, other: 0, note: "Sarandos. Co-CEO Greg Peters was paid ~$60.3M the same year." },
    ],
    acquisitions: [
      { name: "Roald Dahl Story Company", year: 2021, value: 700_000_000, status: "closed", rationale: "Outright IP ownership rather than a licence — a deliberate break from the licensing model." },
      { name: "Scanline VFX", year: 2022, value: null, status: "closed", rationale: "In-house visual effects to control production cost." },
      { name: "Night School Studio", year: 2021, value: null, status: "closed", rationale: "First games studio; the games bet is still unproven." },
      { name: "Millarworld", year: 2017, value: null, status: "closed", rationale: "First acquisition in company history — a comics library." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001065280&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "cost",
    ticker: "COST",
    cik: "0000909832",
    company: "Costco",
    sector: "Retail",
    ceo: "Ron Vachris",
    start: "2024-01-01",
    founder: false,
    doctrine:
      "Started as a forklift driver in 1982. Almost no M&A, a small regular dividend, and enormous irregular special dividends instead of buybacks.",
    compensation: [
      { fy: 2022, total: 1_100_000, salary: 900_000, equity: 0, bonus: 96_000, other: 104_000, note: "As President/COO, before becoming CEO." },
      { fy: 2023, total: 6_600_000, salary: 1_000_000, equity: 5_300_000, bonus: 100_000, other: 200_000, note: "Transition year — named CEO effective 1 Jan 2024." },
      { fy: 2024, total: 9_500_000, salary: 1_100_000, equity: 8_100_000, bonus: 100_000, other: 200_000, note: "First full year as CEO. An order of magnitude below the tech CEOs on this board." },
    ],
    acquisitions: [
      { name: "Innovel Solutions", year: 2020, value: 1_000_000_000, status: "closed", rationale: "Big-and-bulky logistics; one of only two material deals Costco has ever done." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000909832&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
  {
    id: "dis",
    ticker: "DIS",
    cik: "0001744489",
    company: "Walt Disney",
    sector: "Media",
    ceo: "Bob Iger",
    start: "2022-11-20",
    priorTenure: { start: "2005-10-01", end: "2020-02-25" },
    founder: false,
    doctrine:
      "Two tenures. The first was the best acquisition run in modern media — Pixar, Marvel, Lucasfilm, Fox. The second has been spent digesting it and restarting the dividend.",
    compensation: [
      { fy: 2020, total: 21_000_000, salary: 3_000_000, equity: 15_000_000, bonus: 0, other: 3_000_000, note: "Stepped down as CEO in Feb 2020; took a pay cut during the pandemic closures." },
      { fy: 2022, total: 15_400_000, salary: 865_000, equity: 12_500_000, bonus: 1_000_000, other: 1_035_000, note: "Returned as CEO on 20 Nov 2022 — a partial year." },
      { fy: 2023, total: 31_600_000, salary: 865_000, equity: 21_800_000, bonus: 7_800_000, other: 1_135_000 },
      { fy: 2024, total: 41_100_000, salary: 1_000_000, equity: 26_000_000, bonus: 12_000_000, other: 2_100_000, note: "Up 30% as the streaming segment reached profitability." },
    ],
    acquisitions: [
      { name: "21st Century Fox", year: 2017, value: 71_300_000_000, status: "closed", rationale: "Bought the content library that made Disney+ viable, and the debt that constrained it." },
      { name: "Hulu (remaining 33%)", year: 2023, value: 8_600_000_000, status: "closed", rationale: "Comcast put option; the price went to appraisal and settled in 2025." },
      { name: "Pixar", year: 2006, value: 7_400_000_000, status: "closed", rationale: "Iger's first act as CEO; fixed Disney Animation by importing Pixar's leadership." },
      { name: "Marvel Entertainment", year: 2009, value: 4_000_000_000, status: "closed", rationale: "Over $30B of box office since. The best-priced deal on this board." },
      { name: "Lucasfilm", year: 2012, value: 4_050_000_000, status: "closed", rationale: "Star Wars, plus Industrial Light & Magic." },
    ],
    source: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001744489&type=DEF+14A",
    verifiedAsOf: VERIFIED,
  },
];

/** Benchmark the return charts are measured against. */
export const BENCHMARK = {
  ticker: "SPY",
  assetClass: "etf" as const,
  label: "S&P 500 (SPY)",
};

export const byId = (id: string) => ROSTER.find((c) => c.id === id);
