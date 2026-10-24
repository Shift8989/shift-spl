import { q } from "@/lib/server/db";
import { getToken, validIdentity, currentRound } from "@/lib/server/tokens";
import { storeImageFromDataUrl } from "@/lib/server/images";
import { verifySigned, freshEnough } from "@/lib/server/sig";
import { tokenBalance } from "@/lib/server/chain";
import { handler, ok, bad, body } from "@/lib/server/http";

/** Holders propose the next identity. Message: propose:<mint>:<round>:<name>:<symbol>:<ts> */
export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; name: string; symbol: string; image?: string; ts: number; signer: string; signature: string }>(req);
  const t = await getToken(b.mint);
  if (!t || t.status !== "live" || t.mode !== "vote") return bad("not a holder-vote token", 404);
  const { name, symbol } = validIdentity(b);
  if (!freshEnough(Number(b.ts))) return bad("signature expired, sign again");
  const round = currentRound();
  if (!verifySigned(`propose:${t.mint}:${round}:${name}:${symbol}:${b.ts}`, b.signature, b.signer)) return bad("bad signature", 403);
  if ((await tokenBalance(b.signer, t.mint)) <= 0) return bad("you need to hold the token to propose", 403);
  const imageId = b.image ? await storeImageFromDataUrl(b.image) : t.image_id;
  const rows = await q<{ id: number }>(
    `insert into proposals(mint, round, proposer, name, symbol, image_id) values ($1,$2,$3,$4,$5,$6) on conflict (mint, round, proposer) do nothing returning id`,
    [t.mint, round, b.signer, name, symbol, imageId],
  );
  if (!rows.length) return bad("one proposal per wallet per round", 409);
  return ok({ id: rows[0].id, round });
});
