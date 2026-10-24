import { q } from "@/lib/server/db";
import { ENV } from "@/lib/server/env";
import { newSalt, predictTokenAddress } from "@/lib/server/chain";
import { storeImageFromDataUrl } from "@/lib/server/images";
import { metaUri, validIdentity } from "@/lib/server/tokens";
import { handler, ok, bad, body, isAddress } from "@/lib/server/http";
import type { Mode } from "@/lib/types";

type Body = {
  creator: string; name: string; symbol: string; description?: string; twitter?: string; website?: string; image: string;
  mode: Mode; firstBuyEth?: number;
  schedule?: { name: string; symbol: string; image?: string; at: string }[];
};

export const MODES: Mode[] = ["manual", "auto", "scheduled", "vote"];
const url = (s?: string) => (s && /^https?:\/\/\S+$/.test(s) ? s : null);

/** Step 1 of a launch: store the identity, fix the salt + URI, predict the token address. The wallet then calls launch(). */
export const POST = handler(async (req: Request) => {
  const b = await body<Body>(req);
  if (!isAddress(b.creator)) return bad("creator must be a wallet address");
  const { name, symbol } = validIdentity(b);
  if (!MODES.includes(b.mode)) return bad("bad mode");
  if (typeof b.image !== "string") return bad("image is required");
  if (ENV.launchpadAddress === "0x0000000000000000000000000000000000000000") return bad("launchpad contract not configured", 503);
  const imageId = await storeImageFromDataUrl(b.image);

  const sched = b.mode === "scheduled" ? (b.schedule ?? []).slice(0, 4) : [];
  if (b.mode === "scheduled" && sched.length === 0) return bad("A scheduled token needs at least one planned identity");
  const schedRows = [];
  for (const [i, s] of sched.entries()) {
    const id = validIdentity(s);
    const at = new Date(s.at);
    if (Number.isNaN(at.getTime()) || at.getTime() < Date.now() + 60_000) return bad(`Identity ${i + 1}: time must be in the future`);
    schedRows.push({ ...id, imageId: s.image ? await storeImageFromDataUrl(s.image) : imageId, at });
  }

  const salt = newSalt(b.creator);
  const uri = metaUri(salt, 0);
  const token = predictTokenAddress({ name, symbol, uri, creator: b.creator, salt });
  const firstBuyWei = BigInt(Math.round(Math.max(0, Number(b.firstBuyEth ?? 0)) * 1e18));

  await q(
    `insert into tokens(mint, pool, config, quote_mint, pair_symbol, creator, name, symbol, uri, image_id, description, twitter, website, mode, status, first_buy_lamports)
     values ($1,$2,$3,'ETH','ETH',$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft',$13)`,
    [token, ENV.launchpadAddress, salt, b.creator, name, symbol, uri, imageId, (b.description ?? "").slice(0, 500) || null, url(b.twitter), url(b.website), b.mode, firstBuyWei.toString()],
  );
  for (const [i, s] of schedRows.entries()) {
    await q(`insert into schedules(mint, idx, name, symbol, image_id, at) values ($1,$2,$3,$4,$5,$6)`, [token, i, s.name, s.symbol, s.imageId, s.at.toISOString()]);
  }
  return ok({ token, salt, uri, name, symbol, modeIndex: MODES.indexOf(b.mode), launchpad: ENV.launchpadAddress, firstBuyWei: firstBuyWei.toString() });
});
