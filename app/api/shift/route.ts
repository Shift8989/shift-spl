import { getToken, applyShift, validIdentity } from "@/lib/server/tokens";
import { storeImageFromDataUrl } from "@/lib/server/images";
import { verifySigned, freshEnough } from "@/lib/server/sig";
import { handler, ok, bad, body } from "@/lib/server/http";

/**
 * Manual shift. The creator signs (no gas) the message
 *   shift:<token>:<generation+1>:<name>:<symbol>:<timestamp>
 * and the launchpad's authority performs the on-chain rewrite.
 */
export const POST = handler(async (req: Request) => {
  const b = await body<{ mint: string; name: string; symbol: string; image?: string; ts: number; signer: string; signature: string }>(req);
  const t = await getToken(b.mint);
  if (!t || t.status !== "live") return bad("unknown token", 404);
  if (t.mode !== "manual") return bad("only manual-mode tokens are shifted by their creator", 403);
  if (b.signer?.toLowerCase() !== t.creator.toLowerCase()) return bad("only the creator wallet can ask for a shift", 403);
  const { name, symbol } = validIdentity(b);
  if (!freshEnough(Number(b.ts))) return bad("signature expired, sign again");
  const msg = `shift:${t.mint}:${t.generation + 1}:${name}:${symbol}:${b.ts}`;
  if (!(await verifySigned(msg, b.signature, b.signer))) return bad("bad signature", 403);
  const imageId = b.image ? await storeImageFromDataUrl(b.image) : t.image_id;
  return ok(await applyShift(t, { name, symbol, imageId }, "creator"));
});
