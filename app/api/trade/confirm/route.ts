import { q } from "@/lib/server/db";
import { txStatus } from "@/lib/server/chain";
import { getToken } from "@/lib/server/tokens";
import { handler, ok, bad, body, isPubkey } from "@/lib/server/http";

/** Records a trade the wallet just sent, after checking it landed. Amounts are what the quote promised; price derives from them. */
export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; signature: string; side: "buy" | "sell"; quoteAmount: number; baseAmount: number; trader: string }>(req);
  const t = await getToken(b.mint);
  if (!t) return bad("unknown token", 404);
  if (!isPubkey(b.trader) || typeof b.signature !== "string") return bad("bad payload");
  let status = await txStatus(b.signature);
  for (let i = 0; i < 20 && (status === "pending" || status === "unknown"); i++) {
    await new Promise((r) => setTimeout(r, 1500));
    status = await txStatus(b.signature);
  }
  if (status !== "confirmed") return bad(`transaction ${status}`, 409);
  const quote = Number(b.quoteAmount), base = Number(b.baseAmount);
  if (!(quote > 0) || !(base > 0)) return bad("bad amounts");
  await q(`insert into trades(mint, signature, side, quote_amount, base_amount, price, trader) values ($1,$2,$3,$4,$5,$6,$7) on conflict (signature) do nothing`, [
    b.mint, b.signature, b.side === "sell" ? "sell" : "buy", quote, base, quote / base, b.trader,
  ]);
  return ok({ recorded: true });
});
