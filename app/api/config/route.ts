import { q } from "@/lib/server/db";
import { ENV } from "@/lib/server/env";
import { PAIRS } from "@/lib/server/pairs";
import { launchpad } from "@/lib/server/chain";
import { handler, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const configs = await q<{ quote_mint: string; config: string }>(`select quote_mint, config from configs`);
  let authority: string | null = null;
  try { authority = launchpad().publicKey.toBase58(); } catch {}
  return ok({
    configured: Boolean(ENV.launchpadSecret),
    cluster: ENV.cluster,
    updateAuthority: authority,
    keeperIntervalMin: ENV.keeperIntervalMin,
    voteRoundMin: ENV.voteRoundMin,
    initialMarketCap: ENV.initialMarketCap,
    migrationMarketCap: ENV.migrationMarketCap,
    tradingFeeBps: ENV.tradingFeeBps,
    pairs: PAIRS.map((p) => ({ ...p, config: configs.find((c) => c.quote_mint === p.quoteMint)?.config ?? null })),
  });
});
