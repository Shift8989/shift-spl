"use client";

import Link from "next/link";
import { usePoll } from "@/lib/api";
import type { Shift } from "@/lib/types";
import { TimeAgo } from "./TimeAgo";
import { ExternalIcon } from "./Icons";
import { useCluster } from "./ClusterContext";
import { explorer } from "@/lib/format";

export function ShiftLog() {
  const { data, error } = usePoll<Shift[]>("/api/shifts", 20_000);
  const ex = explorer(useCluster());
  return (
    <div className="term mt-8">
      <div className="mono grid grid-cols-[80px_1fr_120px_40px] gap-3 border-b border-line px-4 py-2 text-[10px] text-ink-faint uppercase">
        <span>when</span>
        <span>became</span>
        <span>by</span>
        <span className="text-right">tx</span>
      </div>
      {!data && !error && <div className="mono px-4 py-8 text-center text-[12px] text-ink-faint">loading…</div>}
      {error && <div className="mono px-4 py-8 text-center text-[12px] text-red">{error}</div>}
      {data && data.length === 0 && <div className="mono px-4 py-8 text-center text-[12px] text-ink-faint">no shifts yet · launch a token and rewrite it</div>}
      {data?.map((m) => (
        <div key={m.tx} className="grid grid-cols-[80px_1fr_120px_40px] items-center gap-3 border-b border-line px-4 py-2 text-[13px] last:border-b-0">
          <TimeAgo iso={m.at} className="mono text-[12px] text-ink-faint" />
          <Link className="flex min-w-0 cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80" href={`/specimen/${m.mint}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={m.fromSymbol} loading="lazy" className="shrink-0 rounded bg-bg-2 object-cover opacity-50" src={m.fromImage} style={{ width: 22, height: 22 }} />
            <span className="mono text-[11px] text-ink-faint line-through">${m.fromSymbol}</span>
            <span className="text-ink-faint">→</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={m.toSymbol} loading="lazy" className="shrink-0 rounded-md bg-bg-2 object-cover" src={m.toImage} style={{ width: 26, height: 26 }} />
            <span className="truncate font-semibold">{m.toName}</span>
            <span className="mono text-[11px] text-ink-faint">${m.toSymbol}</span>
          </Link>
          <span className="mono truncate text-[12px] text-ink-soft">{m.by}</span>
          <span className="text-right">
            <a href={ex("tx", m.tx)} target="_blank" rel="noreferrer" className="link text-[12px]" aria-label="View transaction">
              <ExternalIcon />
            </a>
          </span>
        </div>
      ))}
    </div>
  );
}
