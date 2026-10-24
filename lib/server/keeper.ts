import "server-only";
import { q, one, acquireLock, releaseLock } from "./db";
import { ENV } from "./env";
import { listTokens, applyShift, currentRound, type TokenRow } from "./tokens";
import { getTrending } from "./trending";
import { tokenBalance } from "./chain";

type Report = { scheduled: number; votes: number; auto: number; errors: string[] };

/** Runs every few minutes (Vercel cron). Applies due schedules, closes finished vote rounds, mirrors trending for auto tokens. */
export async function runKeeper(): Promise<Report> {
  const rep: Report = { scheduled: 0, votes: 0, auto: 0, errors: [] };
  if (!(await acquireLock("keeper", 240))) {
    rep.errors.push("keeper already running");
    return rep;
  }
  const run = await one<{ id: number }>(`insert into keeper_runs default values returning id`);
  try {
    const tokens = await listTokens();
    const byMint = new Map(tokens.map((t) => [t.mint, t]));

    // 1. scheduled identities whose time has come
    const due = await q<{ id: number; mint: string; name: string; symbol: string; image_id: string | null }>(
      `select id, mint, name, symbol, image_id from schedules where done = false and at <= now() order by at asc`,
    );
    for (const s of due) {
      const t = byMint.get(s.mint);
      if (!t) continue;
      try {
        await applyShift(t, { name: s.name, symbol: s.symbol, imageId: s.image_id }, "schedule");
        await q(`update schedules set done = true where id = $1`, [s.id]);
        t.generation += 1; t.name = s.name; t.symbol = s.symbol; t.image_id = s.image_id;
        rep.scheduled++;
      } catch (e) {
        rep.errors.push(`schedule ${s.mint}: ${(e as Error).message}`);
      }
    }

    // 2. vote rounds that have closed
    const round = currentRound();
    for (const t of tokens.filter((x) => x.mode === "vote")) {
      const open = await q<{ round: string }>(
        `select distinct round from proposals where mint = $1 and round < $2 and round not in (select round from vote_rounds where mint = $1)`,
        [t.mint, round],
      );
      for (const r of open) {
        try {
          const winner = await tallyRound(t, Number(r.round));
          if (winner) {
            await applyShift(t, { name: winner.name, symbol: winner.symbol, imageId: winner.image_id }, "vote");
            t.generation += 1; t.name = winner.name; t.symbol = winner.symbol; t.image_id = winner.image_id;
            rep.votes++;
          }
          await q(`insert into vote_rounds(mint, round, winner_proposal_id) values ($1,$2,$3) on conflict do nothing`, [t.mint, r.round, winner?.id ?? null]);
        } catch (e) {
          rep.errors.push(`vote ${t.mint}: ${(e as Error).message}`);
        }
      }
    }

    // 3. auto · trending: every keeper interval, become a coin that is trending right now
    const autos = tokens.filter((x) => x.mode === "auto");
    if (autos.length) {
      const trending = await getTrending();
      const interval = ENV.keeperIntervalMin * 60_000;
      for (const t of autos) {
        const last = t.last_shift_at ? new Date(t.last_shift_at).getTime() : new Date(t.created_at).getTime();
        if (Date.now() - last < interval - 60_000) continue;
        const pick = trending.find((c) => c.symbol.toUpperCase() !== t.symbol.toUpperCase());
        if (!pick) continue;
        try {
          await applyShift(t, { name: pick.name, symbol: pick.symbol, imageId: null, imageUrl: pick.image }, "keeper");
          rep.auto++;
        } catch (e) {
          rep.errors.push(`auto ${t.mint}: ${(e as Error).message}`);
        }
      }
    }
  } finally {
    await q(`update keeper_runs set finished_at = now(), detail = $2 where id = $1`, [run?.id ?? 0, JSON.stringify(rep)]);
    await releaseLock("keeper");
  }
  return rep;
}

/** Votes weigh by token balance at tally time. One vote per wallet per round. */
async function tallyRound(t: TokenRow, round: number) {
  const proposals = await q<{ id: number; name: string; symbol: string; image_id: string | null; proposer: string }>(
    `select id, name, symbol, image_id, proposer from proposals where mint = $1 and round = $2 order by id asc`,
    [t.mint, round],
  );
  if (!proposals.length) return null;
  const votes = await q<{ voter: string; proposal_id: number }>(`select voter, proposal_id from votes where mint = $1 and round = $2`, [t.mint, round]);
  const weight = new Map<number, number>();
  for (const v of votes) {
    const w = await tokenBalance(v.voter, t.mint);
    weight.set(v.proposal_id, (weight.get(v.proposal_id) ?? 0) + w);
  }
  // a proposal counts as a vote from its proposer too
  for (const p of proposals) {
    if (!votes.some((v) => v.voter === p.proposer)) weight.set(p.id, (weight.get(p.id) ?? 0) + (await tokenBalance(p.proposer, t.mint)));
  }
  let best = proposals[0];
  let bestW = -1;
  for (const p of proposals) {
    const w = weight.get(p.id) ?? 0;
    if (w > bestW) { best = p; bestW = w; }
  }
  return bestW > 0 ? best : null;
}
