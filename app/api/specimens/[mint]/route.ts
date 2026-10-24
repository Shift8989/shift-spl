import { q } from "@/lib/server/db";
import { getToken, toSpecimen, shiftsFor, currentRound } from "@/lib/server/tokens";
import { imageUrl } from "@/lib/server/images";
import { handler, ok, bad } from "@/lib/server/http";
import { ENV } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ mint: string }> }) => {
  const { mint } = await ctx.params;
  const t = await getToken(mint);
  if (!t || t.status !== "live") return bad("not found", 404);
  const round = currentRound();
  const [specimen, shifts, trades, proposals, votes, schedules] = await Promise.all([
    toSpecimen(t),
    shiftsFor(mint),
    q<Record<string, unknown>>(`select signature, side, quote_amount, base_amount, price, trader, at from trades where mint = $1 order by at desc limit 100`, [mint]),
    t.mode === "vote" ? q<Record<string, unknown>>(`select id, name, symbol, image_id, proposer, created_at from proposals where mint = $1 and round = $2 order by id asc`, [mint, round]) : [],
    t.mode === "vote" ? q<{ proposal_id: number; voter: string }>(`select proposal_id, voter from votes where mint = $1 and round = $2`, [mint, round]) : [],
    t.mode === "scheduled" ? q<Record<string, unknown>>(`select idx, name, symbol, image_id, at, done from schedules where mint = $1 order by idx asc`, [mint]) : [],
  ]);
  return ok(
    {
      ...specimen,
      shifts,
      trades: trades.map((r) => ({ ...r, at: new Date(r.at as string).toISOString() })),
      vote: t.mode === "vote" ? { round, closesAt: (round + 1) * ENV.voteRoundMin * 60_000, proposals: proposals.map((p) => ({ ...p, image: imageUrl(p.image_id as string), votes: votes.filter((v) => v.proposal_id === p.id).length })), voters: votes.map((v) => v.voter) } : null,
      schedule: schedules.map((s) => ({ ...s, image: imageUrl(s.image_id as string), at: new Date(s.at as string).toISOString() })),
    },
    { headers: { "cache-control": "no-store" } },
  );
});
