import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** $94.9B, $412M, $1.2K — auto-compact, for stat tiles and labels. */
export function usd(n: number | null | undefined, opts: { decimals?: number } = {}) {
  if (n == null || !Number.isFinite(n)) return "—";
  const { decimals } = opts;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const pick = (div: number, suffix: string, dflt: number) =>
    `${sign}$${(abs / div).toFixed(decimals ?? dflt)}${suffix}`;
  if (abs >= 1e12) return pick(1e12, "T", 2);
  if (abs >= 1e9) return pick(1e9, "B", 1);
  if (abs >= 1e6) return pick(1e6, "M", 1);
  if (abs >= 1e3) return pick(1e3, "K", 0);
  return `${sign}$${abs.toFixed(decimals ?? 0)}`;
}

/** Signed percentage. Large returns lose the decimal — +14,390% not +14,390.2%. */
export function pct(n: number | null | undefined, decimals?: number) {
  if (n == null || !Number.isFinite(n)) return "—";
  const d = decimals ?? (Math.abs(n) >= 100 ? 0 : 1);
  return `${n > 0 ? "+" : ""}${n.toFixed(d)}%`;
}

export function pp(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(0)} pp`;
}

export const num = (n: number | null | undefined, d = 0) =>
  n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: d });

/** "14 yr 11 mo" */
export function tenureLabel(start: string, end?: string) {
  const a = new Date(start);
  const b = end ? new Date(end) : new Date();
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months--;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} yr ${m} mo` : `${y} yr`;
}

export const tenureYears = (start: string, end?: string) =>
  ((end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()) / 3.15576e10;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const fmtMonth = (iso: string) =>
  new Date(iso + (iso.length === 7 ? "-01" : "")).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });

/** Compound annual growth rate, as a percentage, from a total return %. */
export function cagr(totalReturnPct: number, years: number) {
  if (years <= 0) return null;
  return (Math.pow(1 + totalReturnPct / 100, 1 / years) - 1) * 100;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const sum = (xs: (number | null | undefined)[]) =>
  xs.reduce<number>((a, b) => a + (b ?? 0), 0);
