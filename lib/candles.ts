import type { UTCTimestamp } from "lightweight-charts";

/** Deterministic pseudo-random walk seeded from the mint, so each token has a stable chart until a real OHLC feed is wired in. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function buildCandles(mint: string, lastPriceUsd: number, stepSec: number, count = 90) {
  const r = rng(mint + stepSec);
  const now = Math.floor(Date.now() / stepSec) * stepSec;
  // walk backwards from the last price
  const closes: number[] = [lastPriceUsd];
  for (let i = 1; i < count; i++) {
    const prev = closes[i - 1];
    const drift = (r() - 0.48) * 0.08 * prev;
    closes.push(Math.max(prev * 0.4, prev - drift));
  }
  closes.reverse();
  const out = [];
  for (let i = 0; i < count; i++) {
    const open = i === 0 ? closes[0] * (1 + (r() - 0.5) * 0.04) : closes[i - 1];
    const close = closes[i];
    const hi = Math.max(open, close) * (1 + r() * 0.03);
    const lo = Math.min(open, close) * (1 - r() * 0.03);
    out.push({ time: (now - (count - 1 - i) * stepSec) as UTCTimestamp, open, high: hi, low: lo, close });
  }
  return out;
}
