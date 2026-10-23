"use client";

import Link from "next/link";
import type { Specimen } from "@/lib/types";
import { fmtUsd, mcapUsd, MODE_LABEL, countdown, timeAgo, nextBoundary } from "@/lib/format";
import { ClockIcon } from "./Icons";

export function statusLine(s: Specimen, now: number) {
  if (!now) return "…";
  switch (s.mode) {
    case "vote":
      return `Vote closes in ${countdown(nextBoundary(60, now) - now)}`;
    case "auto":
      return `Mirrors a trend in ${countdown(nextBoundary(30, now) - now)}`;
    case "scheduled":
      return s.next ? `Next identity in ${countdown(new Date(s.next).getTime() - now)}` : "Schedule complete";
    default:
      return s.last_shift_at ? `Creator shifted ${timeAgo(s.last_shift_at, now)}` : "Shifts when the creator decides";
  }
}

export function TokenCard({ s, now }: { s: Specimen; now: number }) {
  return (
    <Link className="card card-hover flex cursor-pointer flex-col overflow-hidden" href={`/specimen/${s.mint}`}>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={s.symbol} loading="lazy" className="aspect-square w-full shrink-0 bg-bg-2 object-cover" src={s.image} />
        <span className="mono absolute top-2.5 left-2.5 rounded-md border border-line bg-bg/80 px-1.5 py-0.5 text-[10.5px] backdrop-blur">{MODE_LABEL[s.mode]}</span>
        {s.pair && (
          <span className="mono absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md border border-line bg-bg/80 px-1.5 py-0.5 text-[10.5px] backdrop-blur">
            {s.pair.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="size-3.5 rounded-full" src={s.pair.image} />
            )}
            {s.pair.symbol} pair
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-[-0.02em]">{s.name}</div>
            <div className="mono text-[11.5px] text-ink-soft">
              ${s.symbol}
              {s.generation > 0 && ` · ${s.generation} shift${s.generation > 1 ? "s" : ""}`}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="kicker">mcap</div>
            <div className="mono mt-0.5 text-[13px]">{fmtUsd(mcapUsd(s))}</div>
          </div>
        </div>
        <div className="mt-auto rounded-lg border border-line bg-bg-2 px-2.5 py-2">
          <div className="flex items-center gap-2 text-[12.5px]">
            <ClockIcon className="shrink-0 text-ink-soft" />
            <span className="mono truncate text-ink tabular-nums">{statusLine(s, now)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
