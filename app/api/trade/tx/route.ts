import BN from "bn.js";
import { swapQuote, buildSwapTx, BASE_DECIMALS } from "@/lib/server/chain";
import { getToken } from "@/lib/server/tokens";
import { pairByMint } from "@/lib/server/pairs";
import { handler, ok, bad, body, isPubkey } from "@/lib/server/http";

export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; side: "buy" | "sell"; amount: number; slippageBps?: number; owner: string }>(req);
  if (!isPubkey(b.owner)) return bad("owner must be a wallet address");
  const t = await getToken(b.mint);
  if (!t || t.status !== "live") return bad("unknown token", 404);
  const pair = pairByMint(t.quote_mint)!;
  const amount = Number(b.amount);
  if (!(amount > 0)) return bad("amount must be positive");
  const sell = b.side === "sell";
  const amountIn = new BN(Math.floor(amount * 10 ** (sell ? BASE_DECIMALS : pair.decimals)));
  const qte = await swapQuote(t.pool, amountIn, sell, Math.min(5000, Math.max(1, Number(b.slippageBps ?? 100))));
  if (qte.migrated) return bad("this token graduated: trade it on its DAMM v2 pool", 409);
  const tx = await buildSwapTx({ pool: t.pool, owner: b.owner, amountIn, minimumAmountOut: qte.minimumAmountOut, swapBaseForQuote: sell });
  const outDec = sell ? pair.decimals : BASE_DECIMALS;
  return ok({ ...tx, expectedOut: Number(qte.amountOut.toString()) / 10 ** outDec });
});
