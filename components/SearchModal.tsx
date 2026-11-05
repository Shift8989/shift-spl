"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter as useAppRouter } from "next/navigation";
import type { Specimen } from "@/lib/types";
import { fmtUsd, mcapUsd, MODE_LABEL } from "@/lib/format";
import { SearchIcon } from "./Icons";


export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <SearchPanel onClose={onClose} />;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useAppRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Specimen[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/specimens?limit=200")
      .then((r) => r.json())
      .then((d: Specimen[]) => setItems(d))
      .catch(() => {});
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? items.filter((t) => t.name.toLowerCase().includes(s) || t.symbol.toLowerCase().includes(s) || t.mint.toLowerCase().startsWith(s))
      : items;
    return list.slice(0, 8);
  }, [q, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setIdx((i) => Math.min(i + 1, results.length - 1));
      if (e.key === "ArrowUp") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Enter" && results[idx]) {
        router.push(`/specimen/${results[idx].mint}`);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, idx, router, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-[560px] animate-rise overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search tokens">
        <div className="flex h-12 items-center gap-3 border-b border-line px-4">
          <SearchIcon className="shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
            placeholder="Search by name, ticker or address"
          />
          <kbd className="mono rounded-md border border-line-strong bg-card-2 px-1.5 py-0.5 text-[10.5px] text-ink-soft">esc</kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-1.5">
          {results.length === 0 && <div className="mono px-3 py-6 text-center text-[12px] text-ink-faint">no tokens match</div>}
          {results.map((t, i) => (
            <button
              key={t.mint}
              type="button"
              onMouseEnter={() => setIdx(i)}
              onClick={() => {
                router.push(`/specimen/${t.mint}`);
                onClose();
              }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left ${i === idx ? "bg-card-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={t.image} className="size-8 shrink-0 rounded-md bg-bg-2 object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">{t.name}</span>
                <span className="mono block text-[11px] text-ink-soft">
                  ${t.symbol} · {MODE_LABEL[t.mode]}
                </span>
              </span>
              <span className="mono text-[12px] text-ink-soft">{fmtUsd(mcapUsd(t))}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
