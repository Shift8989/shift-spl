import { NextResponse } from "next/server";

/** Launch endpoint. Wire this to the launchpad signer + Meteora DBC pool creation. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.symbol) return NextResponse.json({ error: "name and symbol are required" }, { status: 400 });
  return NextResponse.json({ error: "Launchpad signer is not configured on this deployment." }, { status: 503 });
}
