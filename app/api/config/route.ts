import { ENV } from "@/lib/server/env";
import { CHAIN, EXPLORER, V4 } from "@/lib/chain-config";
import { launchpadAccount } from "@/lib/server/chain";
import { ethUsd } from "@/lib/server/prices";
import { handler, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  let authority: string | null = null;
  try { authority = launchpadAccount().address; } catch {}
  return ok({
    configured: Boolean(ENV.launchpadKey) && ENV.launchpadAddress !== "0x0000000000000000000000000000000000000000",
    chain: { key: ENV.chainKey, id: CHAIN.id, name: CHAIN.name, explorer: EXPLORER, rpc: ENV.rpcUrl },
    launchpad: ENV.launchpadAddress,
    updateAuthority: authority,
    ethUsd: await ethUsd(),
    keeperIntervalMin: ENV.keeperIntervalMin,
    voteRoundMin: ENV.voteRoundMin,
    tradingFeeBps: ENV.tradingFeeBps,
    curveSupply: ENV.curveSupply,
    totalSupply: ENV.totalSupply,
    v4: V4,
    pairs: [{ quoteMint: "ETH", symbol: "ETH", name: "Ether", decimals: 18, image: null, kind: "sol", config: ENV.launchpadAddress }],
  });
});
