import { NextResponse } from "next/server";
import { getSpecimen, shiftsFor } from "@/lib/data";

export async function GET(_req: Request, ctx: { params: Promise<{ mint: string }> }) {
  const { mint } = await ctx.params;
  const s = getSpecimen(mint);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ...s, shifts: shiftsFor(mint) });
}
