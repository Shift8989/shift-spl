"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Specimen, Shift } from "@/lib/types";
import { fmtUsd, mcapUsd, MODE_LABEL, timeAgo, short, fmtPriceSol, fmtPriceUsd, SOL_USD, countdown, nextBoundary } from "@/lib/format";
import { statusLine } from "./TokenCard";
import { useNow } from "./TokenGrid";
import { ConnectButton } from "./ConnectButton";
import { PriceChart } from "./PriceChart";
import { buildCandles } from "@/lib/candles";
import { ClockIcon, ExternalIcon, SolIcon, ChevronDown } from "./Icons";

const TF = [
  { key: "1m", sec: 60 },
  { key: "15m", sec: 900 },
  { key: "1H", sec: 3600 },
  { key: "4H", sec: 14400 },
  { key: "1D", sec: 86400 },
];

export function SpecimenView({ s, shifts }: { s: Specimen; shifts: Shift[] }) {
  const now = useNow();
  const ago = (iso: string) => (now ? timeAgo(iso, now) : "…");
  const { connected, publicKey } = useWallet();
  const [tf, setTf] = useState("15m");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slip, setSlip] = useState(1);
  const [slipOpen, setSlipOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);

  const priceUsd = s.live.priceSol * SOL_USD;
  const candles = useMemo(() => buildCandles(s.mint, priceUsd, TF.find((t) => t.key === tf)!.sec), [s.mint, priceUsd, tf]);
  const first = candles[0]?.open ?? priceUsd;
  const change = first > 0 ? ((priceUsd - first) / first) * 100 : 0;

  const isCreator = connected && publicKey?.toBase58() === s.creator;
  const amt = Number(amount || 0);
  const receive = amt > 0 ? (side === "buy" ? amt / s.live.priceSol : amt * s.live.priceSol) : 0;
  const fee = amt > 0 ? amt * 0.01 : 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(s.mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const curvePct = `${(s.live.progress * 100).toFixed(1)}%`;

  return (
    <div className="shell pt-5">
      <div className="mono flex items-center gap-2 text-[11.5px] text-ink-faint">
        <Link className="cursor-pointer transition-colors hover:text-ink" href="/explore">
          tokens
        </Link>
        <span>/</span>
        <span className="text-ink-soft">${s.symbol}</span>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <section className="card p-4">
            <div className="flex gap-4">
              <div className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 104, height: 104 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={s.symbol} className="shrink-0 rounded-xl bg-bg-2 object-cover" src={s.image} style={{ width: 104, height: 104 }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip">{MODE_LABEL[s.mode]}</span>
                  <span className="chip">
                    {s.generation} shift{s.generation === 1 ? "" : "s"}
                  </span>
                  {s.pair && (
                    <span className="chip">
                      {s.pair.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="size-3.5 rounded-full" src={s.pair.image} />
                      )}
                      {s.pair.symbol} pair
                    </span>
                  )}
                  {s.live.migrated && <span className="chip">graduated</span>}
                </div>
                <h1 className="mt-2 truncate text-[28px] leading-tight font-semibold tracking-[-0.03em]">
                  <span>{s.name}</span>
                </h1>
                <div className="mono text-[13px] text-ink-soft">
                  $<span>{s.symbol}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button type="button" onClick={copy} className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink">
                    {copied ? "copied" : `CA ${short(s.mint)}`}
                  </button>
                  <a className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink" href={`https://solscan.io/account/${s.creator}`} target="_blank" rel="noreferrer">
                    dev {short(s.creator)}
                  </a>
                  {s.twitter && (
                    <a className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink" href={s.twitter} target="_blank" rel="noreferrer">
                      x
                    </a>
                  )}
                  {s.website && (
                    <a className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink" href={s.website} target="_blank" rel="noreferrer">
                      website
                    </a>
                  )}
                </div>
              </div>
            </div>
            {s.description && <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">{s.description}</p>}
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
              <Stat k="mcap" v={fmtUsd(mcapUsd(s))} />
              <Stat k="price" v={fmtPriceSol(s.live.priceSol)} />
              <Stat k="curve" v={s.live.migrated ? "graduated" : curvePct} />
              <Stat k="launched" v={ago(s.created_at)} />
            </div>
            <div className="mt-3 rounded-lg border border-line bg-bg-2 px-3 py-2">
              <div className="flex items-center gap-2 text-[14px]">
                <ClockIcon size={15} className="shrink-0 text-ink-soft" />
                <span className="mono truncate text-ink tabular-nums">{statusLine(s, now)}</span>
              </div>
            </div>
          </section>

          {s.mode === "vote" && (
            <section className="term">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                <span className="kicker">Holder vote · next identity</span>
                <span className="mono text-[11px] text-ink">closes in {now ? countdown(nextBoundary(60, now) - now) : "…"}</span>
              </div>
              <div className="mono px-3 py-6 text-center text-[12px] text-ink-faint">no proposals this round yet</div>
              <div className="p-3">
                {connected ? (
                  <button type="button" className="btn btn-sm w-full">
                    Propose an identity
                  </button>
                ) : (
                  <ConnectButton size="sm" full label="Connect to vote" />
                )}
                <p className="mono mt-2 text-[10.5px] text-ink-faint">Votes weigh by balance, counted when the round closes. One proposal and one vote per wallet per round. Signing is free.</p>
              </div>
            </section>
          )}

          {s.mode === "manual" && (
            <section className="term">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                <span className="kicker">Shift · creator only</span>
                <span className="mono text-[11px] text-ink-faint">generation {s.generation}</span>
              </div>
              {isCreator ? (
                <div className="p-3">
                  <button type="button" onClick={() => setShiftOpen((v) => !v)} className="btn btn-sm btn-ink w-full">
                    {shiftOpen ? "Close" : "Shift this token"}
                  </button>
                  {shiftOpen && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px]">
                      <input className="field" placeholder="New name" maxLength={32} />
                      <input className="field mono" placeholder="Ticker" maxLength={10} />
                      <input className="field sm:col-span-2" placeholder="Image URL" />
                      <button type="button" className="btn btn-sm sm:col-span-2" disabled>
                        Sign the shift (launchpad signer not configured)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mono px-3 py-5 text-center text-[12px] text-ink-faint">only the creator wallet ({short(s.creator)}) can ask for a shift</div>
              )}
            </section>
          )}

          <section className="term">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
              <div className="flex items-baseline gap-2">
                <span className="kicker">Chart</span>
                <span className="mono text-[13px] text-ink">{fmtPriceUsd(s.live.priceSol)}</span>
                <span className={`mono text-[11.5px] ${change < 0 ? "text-red" : "text-ink-soft"}`}>
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              </div>
              <div className="flex gap-0.5 rounded-md border border-line bg-bg-2 p-0.5">
                {TF.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTf(t.key)}
                    className={`mono h-6 cursor-pointer rounded px-2 text-[11px] transition-colors ${tf === t.key ? "bg-card-2 text-ink" : "text-ink-faint hover:text-ink"}`}
                  >
                    {t.key}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative h-[320px]">
              <PriceChart candles={candles} />
            </div>
          </section>

          <section className="term">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="kicker">Metadata history</span>
              <span className="mono text-[10.5px] text-ink-faint">
                {shifts.length} change{shifts.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mono grid grid-cols-[72px_1fr_44px] gap-3 border-b border-line px-3 py-1.5 text-[10px] text-ink-faint uppercase">
              <span>when</span>
              <span>change</span>
              <span className="text-right">tx</span>
            </div>
            {shifts.map((m) => (
              <div key={m.tx} className="grid grid-cols-[72px_1fr_44px] items-center gap-3 border-b border-line px-3 py-2 text-[12.5px]">
                <span className="mono text-[11.5px] text-ink-faint">{ago(m.at)}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="mono text-[11px] text-ink-faint line-through">${m.fromSymbol}</span>
                  <span className="text-ink-faint">→</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="size-5 rounded bg-bg-2 object-cover" src={m.toImage} />
                  <span className="truncate font-semibold">{m.toName}</span>
                  <span className="mono text-[11px] text-ink-faint">${m.toSymbol}</span>
                  <span className="mono ml-auto text-[10.5px] text-ink-faint">{m.by}</span>
                </span>
                <span className="text-right">
                  <a className="link text-[11px]" href={`https://solscan.io/tx/${m.tx}`} target="_blank" rel="noreferrer" aria-label="View transaction">
                    <ExternalIcon />
                  </a>
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[72px_1fr_44px] items-center gap-3 px-3 py-2 text-[12.5px]">
              <span className="mono text-[11.5px] text-ink-faint">{ago(s.created_at)}</span>
              <span className="mono truncate text-[11.5px] text-ink-faint">launched as ${shifts.length ? shifts[shifts.length - 1].fromSymbol : s.symbol}</span>
              <span className="text-right">
                <a className="link text-[11px]" href={`https://solscan.io/tx/${s.signature}`} target="_blank" rel="noreferrer" aria-label="View launch transaction">
                  <ExternalIcon />
                </a>
              </span>
            </div>
          </section>

          <section className="term">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="kicker">Trades</span>
            </div>
            <div className="mono px-3 py-5 text-center text-[12px] text-ink-faint">no trades yet</div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-3">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg-2 p-0.5">
              {(["buy", "sell"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSide(k)}
                  className={`h-8 cursor-pointer rounded-md text-[13px] font-semibold capitalize transition-colors ${side === k ? "bg-green text-bg" : "text-ink-soft hover:bg-card hover:text-ink"}`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-faint">
              <span>You pay</span>
            </div>
            <div className="relative mt-1.5">
              <input className="field mono h-12 pr-24 text-[18px]" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
              <span className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1.5 text-[15px] font-semibold">
                {side === "buy" ? (
                  <>
                    <SolIcon size={18} /> SOL
                  </>
                ) : (
                  <span className="mono">${s.symbol}</span>
                )}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {(side === "buy" ? ["0.1", "0.5", "1", "5"] : ["25%", "50%", "75%", "100%"]).map((v) => (
                <button key={v} type="button" onClick={() => side === "buy" && setAmount(v)} className="h-8 cursor-pointer rounded-md bg-card-2 text-[12px] font-medium transition-colors hover:border-line-strong hover:text-ink">
                  {v}
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={slipOpen}
                onClick={() => setSlipOpen((v) => !v)}
                className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent bg-card px-4 text-[14px] font-bold transition-colors hover:border-line"
              >
                <span className="truncate">{slip}% slippage</span>
                <ChevronDown className={`ml-auto shrink-0 transition-transform ${slipOpen ? "rotate-180" : ""}`} stroke="#6f6563" />
              </button>
              {slipOpen && (
                <div role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-card p-1">
                  {[0.5, 1, 2, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setSlip(v);
                        setSlipOpen(false);
                      }}
                      className={`flex h-8 w-full cursor-pointer items-center rounded-md px-2.5 text-[13px] ${slip === v ? "bg-card-2 text-ink" : "text-ink-soft hover:bg-card-2 hover:text-ink"}`}
                    >
                      {v}% slippage
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[12.5px]">
              <Row k="You receive" v={receive > 0 ? (side === "buy" ? `${receive.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${s.symbol}` : `${receive.toFixed(4)} SOL`) : "—"} strong />
              <Row k="Minimum received" v={receive > 0 ? (side === "buy" ? `${(receive * (1 - slip / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${s.symbol}` : `${(receive * (1 - slip / 100)).toFixed(4)} SOL`) : "—"} />
              <Row k="Trading fee" v={fee > 0 ? `${fee.toFixed(4)} SOL` : "—"} />
            </div>
            {connected ? (
              <button type="button" className="btn btn-green mt-4 w-full" disabled={!(amt > 0)}>
                {side === "buy" ? `Buy $${s.symbol}` : `Sell $${s.symbol}`}
              </button>
            ) : (
              <ConnectButton className="btn-green mt-4" full />
            )}
            <p className="mt-3 text-center text-[10.5px] text-ink-faint">
              Meteora DBC curve paired with {s.pair?.symbol ?? "SOL"} · you pay and receive SOL{s.pair ? " via Jupiter" : ""}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-card px-3 py-2">
      <div className="kicker">{k}</div>
      <div className="mono mt-0.5 truncate text-[14px] tabular-nums">{v}</div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-soft">{k}</span>
      <span className={`text-right ${strong ? "font-semibold text-ink" : ""}`}>{v}</span>
    </div>
  );
}
