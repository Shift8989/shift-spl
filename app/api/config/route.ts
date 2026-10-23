import { NextResponse } from "next/server";
import { CONFIG } from "@/lib/data";

export function GET() {
  return NextResponse.json(CONFIG);
}
