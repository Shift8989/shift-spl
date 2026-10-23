"use client";

import { useNow } from "./TokenGrid";
import { timeAgo } from "@/lib/format";

export function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  const now = useNow(30_000);
  return <span className={className}>{now ? timeAgo(iso, now) : "…"}</span>;
}
