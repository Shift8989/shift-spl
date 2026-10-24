import "server-only";

export type TrendingCoin = { mint: string; name: string; symbol: string; image: string; marketCapUsd: number; source: string };

let cache: { at: number; data: TrendingCoin[] } | null = null;

/** Trending Solana memecoins from DexScreener's public boosts feed (no API key). Cached 5 minutes. */
export async function getTrending(): Promise<TrendingCoin[]> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.data;
  try {
    const boosts = (await (await fetch("https://api.dexscreener.com/token-boosts/top/v1", { signal: AbortSignal.timeout(8000) })).json()) as { chainId: string; tokenAddress: string }[];
    const addrs = [...new Set(boosts.filter((b) => b.chainId === "solana").map((b) => b.tokenAddress))].slice(0, 30);
    const out: TrendingCoin[] = [];
    for (let i = 0; i < addrs.length; i += 10) {
      const chunk = addrs.slice(i, i + 10);
      const pairs = (await (await fetch(`https://api.dexscreener.com/tokens/v1/solana/${chunk.join(",")}`, { signal: AbortSignal.timeout(8000) })).json()) as {
        baseToken: { address: string; name: string; symbol: string };
        marketCap?: number;
        info?: { imageUrl?: string };
      }[];
      for (const a of chunk) {
        const p = pairs.find((x) => x.baseToken.address === a && x.info?.imageUrl);
        if (!p) continue;
        out.push({ mint: a, name: p.baseToken.name, symbol: p.baseToken.symbol.replace(/^\$/, ""), image: p.info!.imageUrl!, marketCapUsd: p.marketCap ?? 0, source: "dexscreener" });
      }
    }
    const data = out.filter((c) => c.name.length <= 32 && c.symbol.length <= 10).slice(0, 12);
    if (data.length) cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.warn("[trending] fetch failed", e);
    return cache?.data ?? [];
  }
}
