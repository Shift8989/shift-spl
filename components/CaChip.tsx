"use client";

import { useState } from "react";
import { SHIFT_TOKEN, explorerUrl } from "@/lib/chain-config";

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** The $SHIFT token contract address: click to copy, with a link to the explorer. */
export function CaChip({ size = "md", full = false, label = `$${SHIFT_TOKEN.symbol} · CA`, className = "" }: { size?: "sm" | "md"; full?: boolean; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const addr = SHIFT_TOKEN.address;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  const sm = size === "sm";
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-lg border border-line bg-card-2 ${sm ? "h-7 pl-2 pr-1 text-[11px]" : "h-9 pl-3 pr-1.5 text-[12.5px]"} mono text-ink-soft ${className}`}>
      <span className="shrink-0 text-ink-faint">{label}</span>
      <button type="button" onClick={copy} title="Copy the contract address" className="min-w-0 cursor-pointer truncate rounded px-1 text-ink transition-colors hover:bg-card">
        {copied ? "copied" : full ? addr : shortAddr(addr)}
      </button>
      <button type="button" onClick={copy} aria-label="Copy the contract address" className={`flex shrink-0 cursor-pointer items-center justify-center rounded text-ink-faint transition-colors hover:bg-card hover:text-ink ${sm ? "size-5" : "size-7"}`}>
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        )}
      </button>
      <a href={explorerUrl("token", addr)} target="_blank" rel="noreferrer" aria-label="View on the explorer" className={`flex shrink-0 cursor-pointer items-center justify-center rounded text-ink-faint transition-colors hover:bg-card hover:text-ink ${sm ? "size-5" : "size-7"}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></svg>
      </a>
    </span>
  );
}
