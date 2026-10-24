import { q } from "@/lib/server/db";
import { buildLaunchTx } from "@/lib/server/chain";
import { storeImageFromDataUrl } from "@/lib/server/images";
import { pairByMint } from "@/lib/server/pairs";
import { metaUri, validIdentity } from "@/lib/server/tokens";
import { handler, ok, bad, body, isPubkey } from "@/lib/server/http";
import type { Mode } from "@/lib/types";

type Body = {
  creator: string; name: string; symbol: string; description?: string; twitter?: string; website?: string; image: string;
  quoteMint: string; mode: Mode; firstBuyLamports?: number;
  schedule?: { name: string; symbol: string; image?: string; at: string }[];
};

const MODES: Mode[] = ["manual", "auto", "scheduled", "vote"];
const url = (s?: string) => (s && /^https?:\/\/\S+$/.test(s) ? s : null);

/** Step 1 of a launch: store the identity, build the pool-creation transaction (mint keypair signs), hand it to the wallet. */
export const POST = handler(async (req: Request) => {
  const b = await body<Body>(req);
  if (!isPubkey(b.creator)) return bad("creator must be a wallet address");
  const { name, symbol } = validIdentity(b);
  if (!MODES.includes(b.mode)) return bad("bad mode");
  const pair = pairByMint(b.quoteMint);
  if (!pair) return bad("unsupported pair");
  if (typeof b.image !== "string") return bad("image is required");
  const imageId = await storeImageFromDataUrl(b.image);
  const firstBuy = Math.max(0, Math.floor(Number(b.firstBuyLamports ?? 0)));

  const sched = b.mode === "scheduled" ? (b.schedule ?? []).slice(0, 4) : [];
  if (b.mode === "scheduled" && sched.length === 0) return bad("A scheduled token needs at least one planned identity");
  const schedRows = [];
  for (const [i, s] of sched.entries()) {
    const id = validIdentity(s);
    const at = new Date(s.at);
    if (Number.isNaN(at.getTime()) || at.getTime() < Date.now() + 60_000) return bad(`Identity ${i + 1}: time must be in the future`);
    schedRows.push({ ...id, imageId: s.image ? await storeImageFromDataUrl(s.image) : imageId, at });
  }

  const final = await buildLaunchTx({ name, symbol, uriFor: (mint) => metaUri(mint, 0), creator: b.creator, quoteMint: b.quoteMint, firstBuyLamports: firstBuy });

  await q(
    `insert into tokens(mint, pool, config, quote_mint, pair_symbol, creator, name, symbol, uri, image_id, description, twitter, website, mode, status, first_buy_lamports)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'draft',$15)`,
    [final.mint, final.pool, final.config, b.quoteMint, pair.symbol, b.creator, name, symbol, metaUri(final.mint, 0), imageId, (b.description ?? "").slice(0, 500) || null, url(b.twitter), url(b.website), b.mode, firstBuy],
  );
  for (const [i, s] of schedRows.entries()) {
    await q(`insert into schedules(mint, idx, name, symbol, image_id, at) values ($1,$2,$3,$4,$5,$6)`, [final.mint, i, s.name, s.symbol, s.imageId, s.at.toISOString()]);
  }
  return ok({ mint: final.mint, pool: final.pool, txBase64: final.txBase64, lastValidBlockHeight: final.lastValidBlockHeight });
});
