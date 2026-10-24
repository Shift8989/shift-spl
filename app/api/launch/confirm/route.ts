import { q } from "@/lib/server/db";
import { txStatus, dbc } from "@/lib/server/chain";
import { getToken } from "@/lib/server/tokens";
import { handler, ok, bad, body } from "@/lib/server/http";

/** Step 2: the wallet sent the transaction; verify the pool exists on-chain and go live. */
export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; signature: string }>(req);
  const t = await getToken(b.mint);
  if (!t) return bad("unknown mint", 404);
  if (t.status === "live") return ok({ status: "live" });
  if (typeof b.signature !== "string" || b.signature.length < 64) return bad("signature required");
  let status = await txStatus(b.signature);
  for (let i = 0; i < 20 && status === "pending"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    status = await txStatus(b.signature);
  }
  if (status === "failed") return bad("transaction failed on-chain", 409);
  const pool = await dbc.state.getPool(t.pool).catch(() => null);
  if (!pool) return bad(status === "unknown" ? "transaction not found yet, retry in a few seconds" : "pool not found on-chain yet, retry", 409);
  await q(`update tokens set status = 'live', signature = $2 where mint = $1`, [b.mint, b.signature]);
  return ok({ status: "live", mint: b.mint, pool: t.pool });
});
