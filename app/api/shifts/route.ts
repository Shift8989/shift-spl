import { NextResponse } from "next/server";
import { SHIFTS } from "@/lib/data";

export function GET() {
  return NextResponse.json(SHIFTS);
}
