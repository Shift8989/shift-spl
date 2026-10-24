import { NextResponse } from "next/server";
import { getImage } from "@/lib/server/images";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new NextResponse("bad id", { status: 400 });
  const img = await getImage(id);
  if (!img) return new NextResponse("not found", { status: 404 });
  return new NextResponse(new Uint8Array(img.bytes), { headers: { "content-type": img.contentType, "cache-control": "public, max-age=31536000, immutable" } });
}
