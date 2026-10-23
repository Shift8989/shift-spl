import type { Specimen } from "./types";

export const SOL_USD = 102.94;

export function short(addr: string, n = 4) {
  return addr.length <= n * 2 + 1 ? addr : `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

export function fmtUsd(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2).replace(/\.?0+$/, "")}K`;
  return `$${v.toFixed(2)}`;
}

export function mcapUsd(s: Specimen) {
  return s.live.marketCapSol * SOL_USD;
}

export function fmtPriceSol(p: number) {
  if (p === 0) return "0 SOL";
  if (p < 1e-4) return `${p.toExponential(2).replace("e-", "e-")} SOL`;
  return `${p.toFixed(6)} SOL`;
}

export function fmtPriceUsd(p: number) {
  const v = p * SOL_USD;
  if (v === 0) return "$0";
  if (v < 0.01) return `$${v.toFixed(8)}`;
  return `$${v.toFixed(4)}`;
}

export function timeAgo(iso: string, now = Date.now()) {
  const d = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  return `${day}d ago`;
}

export function countdown(ms: number) {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

export const MODE_LABEL: Record<string, string> = {
  manual: "Manual",
  auto: "Auto · trending",
  scheduled: "Scheduled",
  vote: "Holder vote",
};

/** Next keeper / vote boundary, shared across tokens (30 min keeper runs, 60 min vote rounds). */
export function nextBoundary(intervalMin: number, now = Date.now()) {
  const step = intervalMin * 60_000;
  return Math.ceil(now / step) * step;
}

export function mintShort(mint: string) {
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}
