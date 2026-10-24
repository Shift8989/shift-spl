"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { SpecimenDetail } from "@/lib/types";
import { fmtUsd, mcapUsd, MODE_LABEL, timeAgo, short, fmtPriceSol, fmtPriceUsd, SOL_USD, countdown, nextBoundary, fmtNum, explorer } from "@/lib/format";
import { statusLine } from "./TokenCard";
import { useNow } from "./TokenGrid";
import { ConnectButton } from "./ConnectButton";
import { PriceChart } from "./PriceChart";
import { candlesFromTrades } from "@/lib/candles";
import { post, usePoll, fileToDataUrl } from "@/lib/api";
import { signAndSend, signMessage, explain, nowTs } from "@/lib/wallet";
import { useCluster } from "./ClusterContext";
import { ClockIcon, ExternalIcon, SolIcon, ChevronDown, UploadIcon } from "./Icons";

const TF = [
  { key: "1m", sec: 60 },
  { key: "15m", sec: 900 },
  { key: "1H", sec: 3600 },
  { key: "4H", sec: 14400 },
  { key: "1D", sec: 86400 },
];

export function SpecimenView({ mint }: { mint: string }) {
  const { data: s, error, refresh } = usePoll<SpecimenDetail>(`/api/specimens/${mint}`, 15_000);
  if (error) return <div className="shell pt-10 mono text-[12px] text-red">{error}</div>;
  if (!s) return <div className="shell pt-10 mono text-[12px] text-ink-faint">loading…</div>;
  return <Loaded s={s} refresh={refresh} />;
}

function Loaded({ s, refresh }: { s: SpecimenDetail; refresh: () => void }) {
  const now = useNow();
  const wallet = useWallet();
  const cluster = useCluster();
  const ex = explorer(cluster);
  const [tf, setTf] = useState("15m");
  const [copied, setCopied] = useState(false);
  const ago = (iso: string) => (now ? timeAgo(iso, now) : "…");

  const priceUsd = s.live.priceSol * SOL_USD;
  const candles = useMemo(() => candlesFromTrades(s.trades, TF.find((t) => t.key === tf)!.sec, s.live.priceSol * SOL_USD), [s.trades, s.live.priceSol, tf]);
  const first = candles[0]?.open ?? priceUsd;
  const change = first > 0 ? ((priceUsd - first) / first) * 100 : 0;
  const isCreator = wallet.connected && wallet.publicKey?.toBase58() === s.creator;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(s.mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

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
                <img key={s.image} alt={s.symbol} className="animate-morph shrink-0 rounded-xl bg-bg-2 object-cover" src={s.image} style={{ width: 104, height: 104 }} />
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
                  <span key={s.name} className="animate-rise inline-block">{s.name}</span>
                </h1>
                <div className="mono text-[13px] text-ink-soft">
                  $<span>{s.symbol}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button type="button" onClick={copy} className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink">
                    {copied ? "copied" : `CA ${short(s.mint)}`}
                  </button>
                  <a className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink" href={ex("account", s.creator)} target="_blank" rel="noreferrer">
                    dev {short(s.creator)}
                  </a>
                  <a className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink" href={ex("account", s.mint)} target="_blank" rel="noreferrer">
                    solscan
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
              <Stat k="curve" v={s.live.migrated ? "graduated" : `${(s.live.progress * 100).toFixed(1)}%`} />
              <Stat k="launched" v={ago(s.created_at)} />
            </div>
            <div className="mt-3 rounded-lg border border-line bg-bg-2 px-3 py-2">
              <div className="flex items-center gap-2 text-[14px]">
                <ClockIcon size={15} className="shrink-0 text-ink-soft" />
                <span className="mono truncate text-ink tabular-nums">{statusLine(s, now)}</span>
              </div>
            </div>
          </section>

          {s.mode === "vote" && s.vote && <VotePanel s={s} now={now} refresh={refresh} />}
          {s.mode === "manual" && <ShiftPanel s={s} isCreator={Boolean(isCreator)} refresh={refresh} />}
          {s.mode === "scheduled" && (
            <section className="term">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                <span className="kicker">Schedule · planned identities</span>
                <span className="mono text-[11px] text-ink-faint">{s.schedule.filter((x) => x.done).length}/{s.schedule.length} applied</span>
              </div>
              {s.schedule.map((it) => (
                <div key={it.idx} className="flex items-center gap-3 border-b border-line px-3 py-2 text-[13px] last:border-b-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={it.image} className={`size-7 rounded-md object-cover ${it.done ? "opacity-50" : ""}`} />
                  <span className={`truncate font-semibold ${it.done ? "text-ink-faint line-through" : ""}`}>{it.name}</span>
                  <span className="mono text-[11px] text-ink-faint">${it.symbol}</span>
                  <span className="mono ml-auto text-[11px] text-ink-soft tabular-nums">{it.done ? "applied" : now ? countdown(new Date(it.at).getTime() - now) : "…"}</span>
                </div>
              ))}
            </section>
          )}
          {s.mode === "auto" && (
            <section className="term">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                <span className="kicker">Auto · trending</span>
                <span className="mono text-[11px] text-ink">next run in {now ? countdown(nextBoundary(30, now) - now) : "…"}</span>
              </div>
              <p className="mono px-3 py-3 text-[11px] leading-relaxed text-ink-faint">Every keeper run this token takes the identity of a memecoin trending on Solana right now. Nobody signs; the launchpad&apos;s update authority rewrites the metadata.</p>
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
                  <button key={t.key} type="button" onClick={() => setTf(t.key)} className={`mono h-6 cursor-pointer rounded px-2 text-[11px] transition-colors ${tf === t.key ? "bg-card-2 text-ink" : "text-ink-faint hover:text-ink"}`}>
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
                {s.shifts.length} change{s.shifts.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mono grid grid-cols-[72px_1fr_44px] gap-3 border-b border-line px-3 py-1.5 text-[10px] text-ink-faint uppercase">
              <span>when</span>
              <span>change</span>
              <span className="text-right">tx</span>
            </div>
            {s.shifts.map((m) => (
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
                  <a className="link text-[11px]" href={ex("tx", m.tx)} target="_blank" rel="noreferrer" aria-label="View transaction">
                    <ExternalIcon />
                  </a>
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[72px_1fr_44px] items-center gap-3 px-3 py-2 text-[12.5px]">
              <span className="mono text-[11.5px] text-ink-faint">{ago(s.created_at)}</span>
              <span className="mono truncate text-[11.5px] text-ink-faint">launched as ${s.shifts.length ? s.shifts[s.shifts.length - 1].fromSymbol : s.symbol}</span>
              <span className="text-right">
                {s.signature && (
                  <a className="link text-[11px]" href={ex("tx", s.signature)} target="_blank" rel="noreferrer" aria-label="View launch transaction">
                    <ExternalIcon />
                  </a>
                )}
              </span>
            </div>
          </section>

          <section className="term">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="kicker">Trades</span>
              <span className="mono text-[10.5px] text-ink-faint">{s.trades.length}</span>
            </div>
            {s.trades.length === 0 ? (
              <div className="mono px-3 py-5 text-center text-[12px] text-ink-faint">no trades yet</div>
            ) : (
              <>
                <div className="mono grid grid-cols-[72px_56px_1fr_1fr_1fr_40px] gap-3 border-b border-line px-3 py-1.5 text-[10px] text-ink-faint uppercase">
                  <span>when</span>
                  <span>side</span>
                  <span>{s.pair?.symbol ?? "sol"}</span>
                  <span>${s.symbol}</span>
                  <span>trader</span>
                  <span className="text-right">tx</span>
                </div>
                {s.trades.map((t) => (
                  <div key={t.signature} className="mono grid grid-cols-[72px_56px_1fr_1fr_1fr_40px] items-center gap-3 border-b border-line px-3 py-1.5 text-[11.5px] last:border-b-0">
                    <span className="text-ink-faint">{ago(t.at)}</span>
                    <span className={t.side === "buy" ? "text-ink" : "text-red"}>{t.side}</span>
                    <span>{fmtNum(t.quote_amount, 4)}</span>
                    <span>{fmtNum(t.base_amount, 0)}</span>
                    <span className="text-ink-faint">{short(t.trader)}</span>
                    <span className="text-right">
                      <a className="link text-[11px]" href={ex("tx", t.signature)} target="_blank" rel="noreferrer" aria-label="View transaction">
                        <ExternalIcon />
                      </a>
                    </span>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <TradePanel s={s} refresh={refresh} />
        </aside>
      </div>
    </div>
  );
}

function TradePanel({ s, refresh }: { s: SpecimenDetail; refresh: () => void }) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slip, setSlip] = useState(1);
  const [slipOpen, setSlipOpen] = useState(false);
  const [quote, setQuote] = useState<{ amountOut: number; minimumAmountOut: number; tradingFee: number; quoteSymbol: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const owner = wallet.publicKey?.toBase58() ?? null;
  const { data: bal } = usePoll<{ sol: number; token: number }>(owner ? `/api/balance?owner=${owner}&mint=${s.mint}` : null, 20_000);
  const amt = Number(amount || 0);
  const quoteSym = s.pair?.symbol ?? "SOL";

  // debounce quote
  const [qt, setQt] = useState<ReturnType<typeof setTimeout> | null>(null);
  const requestQuote = (a: number, sd: "buy" | "sell", sl: number) => {
    if (qt) clearTimeout(qt);
    if (!(a > 0)) return setQuote(null);
    setQt(setTimeout(() => post<typeof quote>("/api/trade/quote", { mint: s.mint, side: sd, amount: a, slippageBps: sl * 100 }).then(setQuote).catch((e) => setMsg(explain(e))), 250));
  };
  const setAmt = (v: string) => {
    const clean = v.replace(/[^0-9.]/g, "");
    setAmount(clean);
    setMsg(null);
    requestQuote(Number(clean || 0), side, slip);
  };
  const setSd = (v: "buy" | "sell") => {
    setSide(v);
    setAmount("");
    setQuote(null);
  };

  const trade = async () => {
    if (!wallet.publicKey) return;
    setMsg(null);
    try {
      setBusy("Building…");
      const tx = await post<{ txBase64: string; lastValidBlockHeight: number; expectedOut: number }>("/api/trade/tx", { mint: s.mint, side, amount: amt, slippageBps: slip * 100, owner: wallet.publicKey.toBase58() });
      setBusy("Sign in your wallet…");
      const signature = await signAndSend(wallet, connection, tx.txBase64, tx.lastValidBlockHeight);
      setBusy("Recording…");
      await post("/api/trade/confirm", { mint: s.mint, signature, side, quoteAmount: side === "buy" ? amt : tx.expectedOut, baseAmount: side === "buy" ? tx.expectedOut : amt, trader: wallet.publicKey.toBase58() });
      setAmount("");
      setQuote(null);
      refresh();
    } catch (e) {
      setMsg(explain(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card p-3">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg-2 p-0.5">
        {(["buy", "sell"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setSd(k)} className={`h-8 cursor-pointer rounded-md text-[13px] font-semibold capitalize transition-colors ${side === k ? "bg-green text-bg" : "text-ink-soft hover:bg-card hover:text-ink"}`}>
            {k}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-faint">
        <span>You pay</span>
        {bal && <span className="mono">balance {side === "buy" ? `${fmtNum(bal.sol, 3)} SOL` : `${fmtNum(bal.token, 0)} ${s.symbol}`}</span>}
      </div>
      <div className="relative mt-1.5">
        <input className="field mono h-12 pr-24 text-[18px]" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmt(e.target.value)} />
        <span className="pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1.5 text-[15px] font-semibold">
          {side === "buy" ? (
            <>
              {s.pair?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={s.pair.image} className="size-[18px] rounded-full" />
              ) : (
                <SolIcon size={18} />
              )}{" "}
              {quoteSym}
            </>
          ) : (
            <span className="mono">${s.symbol}</span>
          )}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {(side === "buy" ? ["0.1", "0.5", "1", "5"] : ["25%", "50%", "75%", "100%"]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              if (side === "buy") return setAmt(v);
              if (bal) setAmt(String(Math.floor(bal.token * (parseInt(v) / 100) * 1e6) / 1e6));
            }}
            className="h-8 cursor-pointer rounded-md bg-card-2 text-[12px] font-medium transition-colors hover:border-line-strong hover:text-ink"
          >
            {v}
          </button>
        ))}
      </div>
      <div className="relative mt-2">
        <button type="button" aria-haspopup="listbox" aria-expanded={slipOpen} onClick={() => setSlipOpen((v) => !v)} className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-transparent bg-card px-4 text-[14px] font-bold transition-colors hover:border-line">
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
                  requestQuote(amt, side, v);
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
        <Row k="You receive" v={quote ? (side === "buy" ? `${fmtNum(quote.amountOut, 0)} ${s.symbol}` : `${fmtNum(quote.amountOut, 4)} ${quoteSym}`) : "—"} strong />
        <Row k="Minimum received" v={quote ? (side === "buy" ? `${fmtNum(quote.minimumAmountOut, 0)} ${s.symbol}` : `${fmtNum(quote.minimumAmountOut, 4)} ${quoteSym}`) : "—"} />
        <Row k="Trading fee" v={quote ? `${fmtNum(quote.tradingFee, 5)} ${quoteSym}` : "—"} />
      </div>
      {wallet.connected ? (
        <button type="button" className="btn btn-green mt-4 w-full" disabled={!(amt > 0) || !quote || Boolean(busy) || s.live.migrated} onClick={trade}>
          {busy ?? (s.live.migrated ? "Graduated · trade on DAMM v2" : side === "buy" ? `Buy $${s.symbol}` : `Sell $${s.symbol}`)}
        </button>
      ) : (
        <ConnectButton className="btn-green mt-4" full />
      )}
      {msg && <p className="mono mt-2 text-[10.5px] text-red">{msg}</p>}
      <p className="mt-3 text-center text-[10.5px] text-ink-faint">Meteora DBC curve paired with {quoteSym} · 1% trading fee · graduates to DAMM v2 at {fmtNum(s.live.thresholdSol, 0)} {quoteSym}</p>
    </div>
  );
}

function ShiftPanel({ s, isCreator, refresh }: { s: SpecimenDetail; isCreator: boolean; refresh: () => void }) {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const ts = nowTs();
      const sym = symbol.trim().replace(/^\$/, "");
      const { signature, signer } = await signMessage(wallet, `shift:${s.mint}:${s.generation + 1}:${name.trim()}:${sym}:${ts}`);
      await post("/api/shift", { mint: s.mint, name: name.trim(), symbol: sym, image: image ?? undefined, ts, signer, signature });
      setOpen(false);
      setName("");
      setSymbol("");
      setImage(null);
      refresh();
    } catch (e) {
      setMsg(explain(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="term">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="kicker">Shift · creator only</span>
        <span className="mono text-[11px] text-ink-faint">generation {s.generation}</span>
      </div>
      {isCreator ? (
        <div className="p-3">
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn btn-sm btn-ink w-full">
            {open ? "Close" : "Shift this token"}
          </button>
          {open && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[72px_1fr_120px]">
              <label className="flex size-[72px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-bg-2 text-ink-faint">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={image} className="size-full object-cover" />
                ) : (
                  <UploadIcon size={16} />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => e.target.files?.[0] && setImage(await fileToDataUrl(e.target.files[0]))} />
              </label>
              <input className="field" placeholder="New name" maxLength={32} value={name} onChange={(e) => setName(e.target.value)} />
              <input className="field mono" placeholder="Ticker" maxLength={10} value={symbol} onChange={(e) => setSymbol(e.target.value)} />
              <button type="button" className="btn btn-sm sm:col-span-3" disabled={busy || !name.trim() || !symbol.trim()} onClick={submit}>
                {busy ? "Rewriting on-chain…" : "Sign the shift (free)"}
              </button>
              {msg && <p className="mono text-[10.5px] text-red sm:col-span-3">{msg}</p>}
              <p className="mono text-[10.5px] text-ink-faint sm:col-span-3">Your wallet signs a message, the launchpad&apos;s update authority rewrites name, ticker and image in one transaction. Empty image keeps the current one.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mono px-3 py-5 text-center text-[12px] text-ink-faint">only the creator wallet ({short(s.creator)}) can ask for a shift</div>
      )}
    </section>
  );
}

function VotePanel({ s, now, refresh }: { s: SpecimenDetail; now: number; refresh: () => void }) {
  const wallet = useWallet();
  const v = s.vote!;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | "p" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const me = wallet.publicKey?.toBase58();
  const voted = me ? v.voters.includes(me) : false;
  const proposed = me ? v.proposals.some((p) => p.proposer === me) : false;

  const propose = async () => {
    setBusy("p");
    setMsg(null);
    try {
      const ts = nowTs();
      const sym = symbol.trim().replace(/^\$/, "");
      const { signature, signer } = await signMessage(wallet, `propose:${s.mint}:${v.round}:${name.trim()}:${sym}:${ts}`);
      await post("/api/vote/propose", { mint: s.mint, name: name.trim(), symbol: sym, image: image ?? undefined, ts, signer, signature });
      setOpen(false);
      refresh();
    } catch (e) {
      setMsg(explain(e));
    } finally {
      setBusy(null);
    }
  };
  const cast = async (id: number) => {
    setBusy(id);
    setMsg(null);
    try {
      const ts = nowTs();
      const { signature, signer } = await signMessage(wallet, `vote:${s.mint}:${v.round}:${id}:${ts}`);
      await post("/api/vote/cast", { mint: s.mint, proposalId: id, ts, signer, signature });
      refresh();
    } catch (e) {
      setMsg(explain(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="term">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="kicker">Holder vote · next identity</span>
        <span className="mono text-[11px] text-ink">closes in {now ? countdown(v.closesAt - now) : "…"}</span>
      </div>
      {v.proposals.length === 0 ? (
        <div className="mono px-3 py-6 text-center text-[12px] text-ink-faint">no proposals this round yet</div>
      ) : (
        v.proposals.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-line px-3 py-2 text-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={p.image} className="size-8 rounded-md object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{p.name}</span>
              <span className="mono block text-[11px] text-ink-faint">${p.symbol} · by {short(p.proposer)}</span>
            </span>
            <span className="mono text-[11px] text-ink-soft">{p.votes} vote{p.votes === 1 ? "" : "s"}</span>
            {wallet.connected && (
              <button type="button" disabled={busy !== null} onClick={() => cast(p.id)} className="btn btn-sm">
                {busy === p.id ? "…" : voted ? "Change vote" : "Vote"}
              </button>
            )}
          </div>
        ))
      )}
      <div className="p-3">
        {wallet.connected ? (
          <>
            {!proposed && (
              <button type="button" className="btn btn-sm w-full" onClick={() => setOpen((o) => !o)}>
                {open ? "Close" : "Propose an identity"}
              </button>
            )}
            {open && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[72px_1fr_120px]">
                <label className="flex size-[72px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-bg-2 text-ink-faint">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={image} className="size-full object-cover" />
                  ) : (
                    <UploadIcon size={16} />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => e.target.files?.[0] && setImage(await fileToDataUrl(e.target.files[0]))} />
                </label>
                <input className="field" placeholder="Proposed name" maxLength={32} value={name} onChange={(e) => setName(e.target.value)} />
                <input className="field mono" placeholder="Ticker" maxLength={10} value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                <button type="button" className="btn btn-sm btn-ink sm:col-span-3" disabled={busy !== null || !name.trim() || !symbol.trim()} onClick={propose}>
                  {busy === "p" ? "Signing…" : "Sign the proposal (free)"}
                </button>
              </div>
            )}
          </>
        ) : (
          <ConnectButton size="sm" full label="Connect to vote" />
        )}
        {msg && <p className="mono mt-2 text-[10.5px] text-red">{msg}</p>}
        <p className="mono mt-2 text-[10.5px] text-ink-faint">Votes weigh by balance, counted when the round closes. One proposal and one vote per wallet per round. Signing is free.</p>
      </div>
    </section>
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
