import { q } from "@/lib/server/db";
import { txReceipt, decodeLaunchpadLogs } from "@/lib/server/chain";
import { getToken, invalidateLive } from "@/lib/server/tokens";
import { handler, ok, bad, body, isHash } from "@/lib/server/http";

/** Records the fills of a buy/sell transaction from the launchpad's Trade events. */
export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; hash: string }>(req);
  const t = await getToken(b.mint);
  if (!t) return bad("unknown token", 404);
  if (!isHash(b.hash)) return bad("transaction hash required");
  let r = await txReceipt(b.hash);
  for (let i = 0; i < 20 && !r; i++) {
    await new Promise((res) => setTimeout(res, 1500));
    r = await txReceipt(b.hash);
  }
  if (!r) return bad("transaction not found yet", 409);
  if (r.status !== "success") return bad("transaction reverted", 409);
  let n = 0;
  for (const e of decodeLaunchpadLogs(r.logs).filter((x) => x.eventName === "Trade" && String(x.args.token).toLowerCase() === t.mint.toLowerCase())) {
    const a = e.args as { trader: string; isBuy: boolean; ethAmount: bigint; tokenAmount: bigint };
    const eth = Number(a.ethAmount) / 1e18, tok = Number(a.tokenAmount) / 1e18;
    if (!(eth > 0) || !(tok > 0)) continue;
    await q(`insert into trades(mint, signature, side, quote_amount, base_amount, price, trader) values ($1,$2,$3,$4,$5,$6,$7) on conflict (signature) do nothing`, [t.mint, b.hash, a.isBuy ? "buy" : "sell", eth, tok, eth / tok, a.trader]);
    n++;
  }
  invalidateLive(t.mint);
  return ok({ recorded: n });
});
