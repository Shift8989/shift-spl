import { tokenBalance, solBalance } from "@/lib/server/chain";
import { handler, ok, bad, isPubkey } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const u = new URL(req.url);
  const owner = u.searchParams.get("owner");
  const mint = u.searchParams.get("mint");
  if (!isPubkey(owner)) return bad("owner required");
  const [sol, token] = await Promise.all([solBalance(owner), isPubkey(mint) ? tokenBalance(owner, mint) : 0]);
  return ok({ sol, token });
});
