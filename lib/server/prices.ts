import "server-only";

let cache: { at: number; usd: number } | null = null;

/** ETH/USD for display, from Coinbase's public spot endpoint. Cached 2 minutes. */
export async function ethUsd() {
  if (cache && Date.now() - cache.at < 120_000) return cache.usd;
  try {
    const r = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", { signal: AbortSignal.timeout(5000) });
    const j = (await r.json()) as { data: { amount: string } };
    const usd = Number(j.data.amount);
    if (usd > 0) cache = { at: Date.now(), usd };
  } catch {}
  return cache?.usd ?? 3500;
}
