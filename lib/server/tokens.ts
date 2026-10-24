import "server-only";
import { q, one } from "./db";
import { ENV } from "./env";
import { imageUrl, storeImageFromUrl } from "./images";
import { pairByMint } from "./pairs";
import { poolLive, rewriteMetadata, type Live } from "./chain";
import type { Specimen, Shift, Mode } from "@/lib/types";

export type TokenRow = {
  mint: string; pool: string; config: string; quote_mint: string; pair_symbol: string; creator: string;
  name: string; symbol: string; uri: string; image_id: string | null; description: string | null; twitter: string | null; website: string | null;
  mode: Mode; generation: number; status: string; signature: string | null; first_buy_lamports: string | number; created_at: string | Date; last_shift_at: string | Date | null;
};

export function metaUri(mint: string, generation: number) {
  return `${ENV.baseUrl}/api/meta/${mint}?g=${generation}`;
}

const iso = (d: string | Date | null) => (d ? new Date(d).toISOString() : null);

export async function listTokens(status = "live") {
  return q<TokenRow>(`select * from tokens where status = $1 order by created_at desc`, [status]);
}

export async function getToken(mint: string) {
  return one<TokenRow>(`select * from tokens where mint = $1`, [mint]);
}

export async function nextScheduled(mint: string) {
  return one<{ at: string | Date }>(`select at from schedules where mint = $1 and done = false order by at asc limit 1`, [mint]);
}

// live pool state cache (15 s) so list pages don't hammer the RPC
const liveCache = new Map<string, { at: number; live: Live | null }>();
export async function liveFor(t: TokenRow) {
  const hit = liveCache.get(t.mint);
  if (hit && Date.now() - hit.at < 15_000) return hit.live;
  const pair = pairByMint(t.quote_mint);
  let live: Live | null = null;
  try {
    live = await poolLive(t.pool, pair?.decimals ?? 9);
  } catch (e) {
    console.warn("[live]", t.mint, e);
  }
  liveCache.set(t.mint, { at: Date.now(), live });
  return live;
}

const EMPTY_LIVE = (pool: string): Live => ({ pool, priceSol: 0, supply: ENV.totalSupply, marketCapSol: 0, quoteReserveSol: 0, thresholdSol: 0, progress: 0, migrated: false, curveComplete: false });

export async function toSpecimen(t: TokenRow): Promise<Specimen> {
  const [live, next] = await Promise.all([liveFor(t), t.mode === "scheduled" ? nextScheduled(t.mint) : null]);
  const pair = pairByMint(t.quote_mint);
  return {
    mint: t.mint, pool: t.pool, creator: t.creator, generation: t.generation, form_count: 1,
    name: t.name, symbol: t.symbol, uri: t.uri, image: imageUrl(t.image_id), description: t.description, twitter: t.twitter, telegram: null, website: t.website,
    first_buy_lamports: Number(t.first_buy_lamports), status: t.status, signature: t.signature ?? "", last_shift_at: iso(t.last_shift_at), dormant_reason: null,
    created_at: iso(t.created_at)!, mode: t.mode, mirror_mint: null, quote_mint: pair?.kind === "sol" ? null : t.quote_mint,
    pair: pair && pair.kind !== "sol" ? { symbol: pair.symbol, image: pair.image } : null,
    live: live ?? EMPTY_LIVE(t.pool), next: next ? iso(next.at) : null,
  };
}

export async function listSpecimens(limit = 200) {
  const rows = await listTokens();
  return Promise.all(rows.slice(0, limit).map(toSpecimen));
}

export async function shiftsFor(mint?: string): Promise<Shift[]> {
  const rows = mint
    ? await q<Record<string, string>>(`select * from shifts where mint = $1 order by at desc`, [mint])
    : await q<Record<string, string>>(`select * from shifts order by at desc limit 200`);
  return rows.map((r) => ({
    at: new Date(r.at).toISOString(), mint: r.mint, fromSymbol: r.from_symbol, fromImage: imageUrl(r.from_image), toName: r.to_name, toSymbol: r.to_symbol, toImage: imageUrl(r.to_image),
    by: r.by_ as Shift["by"], tx: r.tx,
  }));
}

export type Identity = { name: string; symbol: string; imageId: string | null; imageUrl?: string };

export function validIdentity(i: { name?: unknown; symbol?: unknown }) {
  const name = String(i.name ?? "").trim();
  const symbol = String(i.symbol ?? "").trim().replace(/^\$/, "");
  if (name.length < 1 || name.length > 32) throw new Error("Name must be 1–32 characters");
  if (symbol.length < 1 || symbol.length > 10) throw new Error("Ticker must be 1–10 characters");
  return { name, symbol };
}

/**
 * The STS-1 shift. Rewrites the on-chain metadata (launchpad signs), then records the new identity.
 * `by` is who asked: creator, keeper, schedule or vote.
 */
export async function applyShift(t: TokenRow, next: Identity, by: Shift["by"]) {
  const gen = t.generation + 1;
  let imageId = next.imageId;
  if (!imageId && next.imageUrl) imageId = await storeImageFromUrl(next.imageUrl);
  const uri = metaUri(t.mint, gen);
  const tx = await rewriteMetadata(t.mint, { name: next.name, symbol: next.symbol, uri }, `shift:${by}:${gen}`);
  await q(
    `insert into shifts(mint, generation, from_name, from_symbol, from_image, to_name, to_symbol, to_image, by_, tx) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [t.mint, gen, t.name, t.symbol, t.image_id, next.name, next.symbol, imageId, by, tx],
  );
  await q(`update tokens set name=$2, symbol=$3, image_id=$4, uri=$5, generation=$6, last_shift_at=now() where mint=$1`, [t.mint, next.name, next.symbol, imageId, uri, gen]);
  liveCache.delete(t.mint);
  console.log(`[shift] ${t.mint} gen ${gen} by ${by}: $${t.symbol} → $${next.symbol} (${tx})`);
  return { tx, generation: gen };
}

export function currentRound(now = Date.now()) {
  return Math.floor(now / (ENV.voteRoundMin * 60_000));
}
