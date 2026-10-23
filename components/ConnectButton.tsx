"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { CloseIcon } from "./Icons";
import { short } from "@/lib/format";

export function ConnectButton({ size = "md", className = "", label = "Connect wallet", full = false }: { size?: "sm" | "md"; className?: string; label?: string; full?: boolean }) {
  const { publicKey, connected, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  if (connected && publicKey) {
    return (
      <div className="relative">
        <button type="button" className={`btn ${size === "sm" ? "btn-sm" : ""} mono ${full ? "w-full" : ""} ${className}`} onClick={() => setMenu((v) => !v)}>
          {short(publicKey.toBase58())}
        </button>
        {menu && (
          <div className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-lg border border-line bg-card p-1">
            <button
              type="button"
              className="flex h-8 w-full cursor-pointer items-center rounded-md px-2.5 text-[13px] text-ink-soft hover:bg-card-2 hover:text-ink"
              onClick={() => {
                setMenu(false);
                disconnect();
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button type="button" className={`btn ${size === "sm" ? "btn-sm" : ""} ${full ? "w-full" : ""} ${className}`} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && <WalletModal onClose={() => setOpen(false)} />}
    </>
  );
}

function WalletModal({ onClose }: { onClose: () => void }) {
  const { wallets, select, connecting } = useWallet();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pick = async (name: string) => {
    setError(null);
    const w = wallets.find((x) => x.adapter.name === name);
    if (!w) return;
    if (w.readyState !== WalletReadyState.Installed && w.readyState !== WalletReadyState.Loadable) {
      window.open(w.adapter.url, "_blank", "noreferrer");
      return;
    }
    try {
      select(w.adapter.name);
      await w.adapter.connect();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="card w-full max-w-[380px] animate-rise p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Connect wallet">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Connect wallet</div>
            <div className="mono mt-0.5 text-[10.5px] text-ink-faint">solana · mainnet</div>
          </div>
          <button type="button" aria-label="Close" className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-line text-ink-faint hover:text-ink" onClick={onClose}>
            <CloseIcon size={12} />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          {wallets.map((w) => {
            const installed = w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable;
            return (
              <button
                key={w.adapter.name}
                type="button"
                disabled={connecting}
                onClick={() => pick(w.adapter.name)}
                className="flex h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-bg-2 px-3 text-left transition-colors hover:border-line-strong hover:bg-card-2 disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={w.adapter.icon} className="size-7 rounded-md" />
                <span className="flex-1 text-[14px] font-semibold">{w.adapter.name}</span>
                <span className="mono text-[10.5px] text-ink-faint">{installed ? "detected" : "install"}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="mono mt-3 text-[11px] text-red">{error}</p>}
        <p className="mono mt-3 text-[10.5px] leading-relaxed text-ink-faint">Connecting only reads your address. Every action asks for a signature.</p>
      </div>
    </div>
  );
}
