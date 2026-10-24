import { q } from "@/lib/server/db";
import { txReceipt, decodeLaunchpadLogs } from "@/lib/server/chain";
import { getToken, invalidateLive } from "@/lib/server/tokens";
import { handler, ok, bad, body, isHash } from "@/lib/server/http";

/** Step 2: the wallet sent launch(); verify the Launched event for this token and go live. Records the first buy if any. */
export const POST = handler(async (req: Request) => {
  const b = await body<{ token: string; hash: string }>(req);
  const t = await getToken(b.token);
  if (!t) return bad("unknown token", 404);
  if (t.status === "live") return ok({ status: "live" });
  if (!isHash(b.hash)) return bad("transaction hash required");
  let r = await txReceipt(b.hash);
  for (let i = 0; i < 20 && !r; i++) {
    await new Promise((res) => setTimeout(res, 1500));
    r = await txReceipt(b.hash);
  }
  if (!r) return bad("transaction not found yet, retry in a few seconds", 409);
  if (r.status !== "success") return bad("transaction reverted on-chain", 409);
  const evs = decodeLaunchpadLogs(r.logs);
  const launched = evs.find((e) => e.eventName === "Launched" && String(e.args.token).toLowerCase() === t.mint.toLowerCase());
  if (!launched) return bad("no Launched event for this token in that transaction", 409);
  await q(`update tokens set status = 'live', signature = $2 where mint = $1`, [t.mint, b.hash]);
  for (const e of evs.filter((x) => x.eventName === "Trade")) {
    const a = e.args as { trader: string; isBuy: boolean; ethAmount: bigint; tokenAmount: bigint };
    const eth = Number(a.ethAmount) / 1e18, tok = Number(a.tokenAmount) / 1e18;
    if (eth > 0 && tok > 0) await q(`insert into trades(mint, signature, side, quote_amount, base_amount, price, trader) values ($1,$2,$3,$4,$5,$6,$7) on conflict (signature) do nothing`, [t.mint, b.hash, a.isBuy ? "buy" : "sell", eth, tok, eth / tok, a.trader]);
  }
  invalidateLive(t.mint);
  return ok({ status: "live", token: t.mint });
});
