"use client";

import { useEffect, useMemo, useState } from "react";
import type { Specimen } from "@/lib/types";
import { mcapUsd, nextBoundary } from "@/lib/format";
import { TokenCard } from "./TokenCard";

const MODES = [
  { key: "all", label: "All" },
  { key: "auto", label: "Auto" },
  { key: "scheduled", label: "Scheduled" },
  { key: "vote", label: "Vote" },
  { key: "manual", label: "Manual" },
] as const;

const SORTS = [
  { key: "soon", label: "Shifting soon" },
  { key: "new", label: "New" },
  { key: "mcap", label: "Mcap" },
  { key: "shifted", label: "Most shifted" },
] as const;

type ModeKey = (typeof MODES)[number]["key"];
type SortKey = (typeof SORTS)[number]["key"];

function nextAt(s: Specimen, now: number) {
  if (s.mode === "vote") return nextBoundary(60, now);
  if (s.mode === "auto") return nextBoundary(30, now);
  if (s.mode === "scheduled" && s.next) return new Date(s.next).getTime();
  return Number.POSITIVE_INFINITY;
}

function Tabs<T extends string>({ items, value, onChange }: { items: readonly { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1" role="tablist">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          role="tab"
          aria-selected={value === it.key}
          onClick={() => onChange(it.key)}
          className={`h-8 shrink-0 cursor-pointer rounded-lg px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
            value === it.key ? "bg-card-2 text-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** 0 until mounted so server and client render the same markup; then ticks every `step` ms. */
export function useNow(step = 1000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time clock sync, intentional
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), step);
    return () => clearInterval(id);
  }, [step]);
  return now;
}

export function TokenGrid({ items, title }: { items: Specimen[]; title: string }) {
  const [mode, setMode] = useState<ModeKey>("all");
  const [sort, setSort] = useState<SortKey>("soon");
  const now = useNow();
  const minute = Math.floor(now / 60_000);

  const list = useMemo(() => {
    const filtered = mode === "all" ? items : items.filter((s) => s.mode === mode);
    const arr = [...filtered];
    switch (sort) {
      case "new":
        arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "mcap":
        arr.sort((a, b) => mcapUsd(b) - mcapUsd(a));
        break;
      case "shifted":
        arr.sort((a, b) => b.generation - a.generation);
        break;
      default:
        arr.sort((a, b) => nextAt(a, now) - nextAt(b, now) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
    // re-sort at most once a minute, not on every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mode, sort, minute]);

  return (
    <section className="mt-14 border-t border-line py-10">
      <div className="shell">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="display text-[26px]">{title}</h2>
          <div className="flex flex-wrap gap-2">
            <Tabs items={MODES} value={mode} onChange={setMode} />
            <Tabs items={SORTS} value={sort} onChange={setSort} />
          </div>
        </div>
        <div className="mt-6">
          {list.length === 0 ? (
            <div className="term mono px-3 py-10 text-center text-[12px] text-ink-faint">no tokens in this view yet</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {list.map((s) => (
                <TokenCard key={s.mint} s={s} now={now} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
