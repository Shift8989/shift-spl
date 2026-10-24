import type { UTCTimestamp } from "lightweight-charts";
import type { Trade } from "./types";

export type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };

/** OHLC candles from recorded trades. `last` seeds the latest bucket when there are no trades yet. */
export function candlesFromTrades(trades: Trade[], stepSec: number, last: number, count = 60): Candle[] {
  const now = Math.floor(Date.now() / stepSec) * stepSec;
  const buckets = new Map<number, number[]>();
  for (const t of trades) {
    const b = Math.floor(new Date(t.at).getTime() / 1000 / stepSec) * stepSec;
    buckets.set(b, [...(buckets.get(b) ?? []), t.price]);
  }
  const out: Candle[] = [];
  let prev = trades.length ? trades[trades.length - 1].price : last;
  for (let i = count - 1; i >= 0; i--) {
    const time = (now - i * stepSec) as UTCTimestamp;
    const px = buckets.get(time);
    if (px && px.length) {
      out.push({ time, open: prev, high: Math.max(prev, ...px), low: Math.min(prev, ...px), close: px[px.length - 1] });
      prev = px[px.length - 1];
    } else {
      out.push({ time, open: prev, high: prev, low: prev, close: prev });
    }
  }
  if (out.length) out[out.length - 1].close = last || prev;
  return out;
}
