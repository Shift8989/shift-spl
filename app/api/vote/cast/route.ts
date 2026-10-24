import type { Address } from "viem";
import { q, one } from "@/lib/server/db";
import { getToken, currentRound } from "@/lib/server/tokens";
import { verifySigned, freshEnough } from "@/lib/server/sig";
import { tokenBalance } from "@/lib/server/chain";
import { handler, ok, bad, body, isAddress } from "@/lib/server/http";

/** Message: vote:<token>:<round>:<proposalId>:<ts> */
export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; proposalId: number; ts: number; signer: string; signature: string }>(req);
  const t = await getToken(b.mint);
  if (!t || t.status !== "live" || t.mode !== "vote") return bad("not a holder-vote token", 404);
  if (!isAddress(b.signer)) return bad("signer must be a wallet address");
  const round = currentRound();
  const p = await one<{ id: number }>(`select id from proposals where id = $1 and mint = $2 and round = $3`, [Number(b.proposalId), t.mint, round]);
  if (!p) return bad("proposal not in the current round");
  if (!freshEnough(Number(b.ts))) return bad("signature expired, sign again");
  if (!(await verifySigned(`vote:${t.mint}:${round}:${p.id}:${b.ts}`, b.signature, b.signer))) return bad("bad signature", 403);
  const bal = await tokenBalance(b.signer, t.mint as Address);
  if (bal <= 0) return bad("you need to hold the token to vote", 403);
  await q(`insert into votes(mint, round, voter, proposal_id) values ($1,$2,$3,$4) on conflict (mint, round, voter) do update set proposal_id = excluded.proposal_id`, [t.mint, round, b.signer.toLowerCase(), p.id]);
  return ok({ round, weight: bal });
});
