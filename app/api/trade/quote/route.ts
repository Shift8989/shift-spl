import { parseEther, formatEther, type Address } from "viem";
import { quoteBuy, quoteSell } from "@/lib/server/chain";
import { getToken } from "@/lib/server/tokens";
import { handler, ok, bad, body } from "@/lib/server/http";

export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; side: "buy" | "sell"; amount: number; slippageBps?: number }>(req);
  const t = await getToken(b.mint);
  if (!t || t.status !== "live") return bad("unknown token", 404);
  const amount = Number(b.amount);
  if (!(amount > 0)) return bad("amount must be positive");
  const slip = BigInt(Math.min(5000, Math.max(1, Number(b.slippageBps ?? 100))));
  const wei = parseEther(amount.toFixed(18));
  if (b.side === "sell") {
    const { ethOut, fee } = await quoteSell(t.mint as Address, wei);
    const min = (ethOut * (10_000n - slip)) / 10_000n;
    return ok({ amountOut: Number(formatEther(ethOut)), minimumAmountOut: Number(formatEther(min)), tradingFee: Number(formatEther(fee)), quoteSymbol: "ETH", amountInWei: wei.toString(), minOutWei: min.toString() });
  }
  const { tokensOut, ethUsed, fee } = await quoteBuy(t.mint as Address, wei);
  const min = (tokensOut * (10_000n - slip)) / 10_000n;
  return ok({ amountOut: Number(formatEther(tokensOut)), minimumAmountOut: Number(formatEther(min)), tradingFee: Number(formatEther(fee)), quoteSymbol: "ETH", amountInWei: wei.toString(), minOutWei: min.toString(), ethUsed: Number(formatEther(ethUsed)) });
});
