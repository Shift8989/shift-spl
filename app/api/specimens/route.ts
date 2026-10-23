import { NextResponse } from "next/server";
import { SPECIMENS } from "@/lib/data";

export function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 200);
  return NextResponse.json(SPECIMENS.slice(0, limit));
}
