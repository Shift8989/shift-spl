import type { Metadata } from "next";
import Link from "next/link";
import { SHIFTS } from "@/lib/data";
import { TimeAgo } from "@/components/TimeAgo";
import { ExternalIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "Shifts · Shift" };

export default function Shifts() {
  return (
    <div className="shell pt-10">
      <div className="kicker">Engine log</div>
      <h1 className="display mt-2 text-[30px]">Shifts</h1>
      <p className="mt-2 max-w-xl text-[14px] text-ink-soft">Every on-chain identity rewrite across the platform, by the creator, a schedule, or the keeper.</p>
      <div className="term mt-8">
        <div className="mono grid grid-cols-[80px_1fr_120px_40px] gap-3 border-b border-line px-4 py-2 text-[10px] text-ink-faint uppercase">
          <span>when</span>
          <span>became</span>
          <span>by</span>
          <span className="text-right">tx</span>
        </div>
        {SHIFTS.map((m) => (
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
              <a href={`https://solscan.io/tx/${m.tx}`} target="_blank" rel="noreferrer" className="link text-[12px]" aria-label="View transaction">
                <ExternalIcon />
              </a>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
