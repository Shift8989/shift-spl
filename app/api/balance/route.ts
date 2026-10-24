import type { Address } from "viem";
import { tokenBalance, ethBalance } from "@/lib/server/chain";
import { handler, ok, bad, isAddress } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const u = new URL(req.url);
  const owner = u.searchParams.get("owner");
  const mint = u.searchParams.get("mint");
  if (!isAddress(owner)) return bad("owner required");
  const [eth, token] = await Promise.all([ethBalance(owner), isAddress(mint) ? tokenBalance(owner, mint as Address) : 0]);
  return ok({ sol: eth, eth, token });
});
