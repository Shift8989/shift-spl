import "server-only";
import type { Address } from "viem";
import { q } from "./db";
import { migratePool } from "./chain";
import { listTokens, liveFor, invalidateLive } from "./tokens";

/**
 * Graduation. When a curve completes, the migrator (launchpad key) pulls the raised ETH and the unsold
 * 200M tokens out of the launchpad contract. Seeding the Uniswap v4 pool from those funds is the next step
 * of this routine; until then the funds sit in the launchpad wallet and the token page shows "graduated".
 */
export async function processGraduations() {
  const done: string[] = [];
  const errors: string[] = [];
  for (const t of await listTokens()) {
    const live = await liveFor(t);
    if (!live || !live.curveComplete || live.migrated) continue;
    try {
      const tx = await migratePool(t.mint as Address);
      invalidateLive(t.mint);
      await q(`insert into keeper_runs(detail) values ($1)`, [JSON.stringify({ migrated: t.mint, tx })]);
      done.push(t.mint);
    } catch (e) {
      errors.push(`migrate ${t.mint}: ${(e as Error).message}`);
    }
  }
  return { done, errors };
}
