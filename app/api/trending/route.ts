import { NextResponse } from "next/server";
import { TRENDING } from "@/lib/data";

export function GET() {
  return NextResponse.json(TRENDING);
}
