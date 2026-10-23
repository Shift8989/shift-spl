import { NextResponse } from "next/server";

const GATEWAYS = [
  (cid: string) => `https://${cid}.ipfs.w3s.link`,
  (cid: string) => `https://gateway.pinata.cloud/ipfs/${cid}`,
  (cid: string) => `https://dweb.link/ipfs/${cid}`,
  (cid: string) => `https://ipfs.io/ipfs/${cid}`,
];

/** IPFS image proxy: public gateways rate-limit and block cross-origin embeds, so images are fetched server-side and cached at the edge. */
export async function GET(_req: Request, ctx: { params: Promise<{ cid: string }> }) {
  const { cid } = await ctx.params;
  if (!/^[a-zA-Z0-9]{40,70}$/.test(cid)) return new NextResponse("bad cid", { status: 400 });
  for (const gw of GATEWAYS) {
    try {
      const r = await fetch(gw(cid), { signal: AbortSignal.timeout(8000), headers: { accept: "image/*" }, next: { revalidate: 86400 } });
      if (!r.ok) continue;
      const type = r.headers.get("content-type") ?? "image/png";
      if (!type.startsWith("image/")) continue;
      const buf = await r.arrayBuffer();
      return new NextResponse(buf, {
        headers: { "content-type": type, "cache-control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400" },
      });
    } catch {
      /* try the next gateway */
    }
  }
  return new NextResponse("not found", { status: 404 });
}
