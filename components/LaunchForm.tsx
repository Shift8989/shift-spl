"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { launchpadAbi } from "@/lib/abi";
import type { Address, Hex } from "viem";
import type { Config, Mode, PairConfig } from "@/lib/types";
import { post, usePoll, fileToDataUrl } from "@/lib/api";
import { explain } from "@/lib/wallet";
import { ConnectButton } from "./ConnectButton";
import { EthIcon, UploadIcon, WalletIcon, KeyIcon, TimerIcon, TrendIcon, VoteIcon } from "./Icons";

const MODES: { key: Mode; label: string; desc: string; note: string }[] = [
  { key: "manual", label: "Manual", desc: "You shift it from the token page whenever you want, by signing with your wallet", note: "Change the name, ticker or image from the token page, any time. Only your wallet can ask. Signing is free; the launchpad pays the rewrite." },
  { key: "auto", label: "Auto · trending", desc: "Every keeper run it becomes a memecoin that is trending right now", note: "Every keeper run (30 min) the token takes the name, ticker and image of whatever is trending right now. No input needed after launch." },
  { key: "scheduled", label: "Scheduled", desc: "Plan up to 4 identities now, each switching in at a set time", note: "Plan the identities now. The keeper rewrites the token at each scheduled time, in order, then stops." },
  { key: "vote", label: "Holder vote", desc: "Holders propose and vote each round; the winner becomes its next identity", note: "Each round (60 min) holders propose and vote by balance. When the round closes, the winning proposal becomes the token's next identity." },
];

function pairName(p: PairConfig) {
  return p.kind === "sol" ? "Ether" : p.name.replace(/ xStock$/, "");
}

type Planned = { name: string; symbol: string; image: string | null; at: string };

const inHours = (h: number) => {
  const d = new Date(Date.now() + h * 3600_000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function LaunchForm() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const router = useRouter();
  const { data: config } = usePoll<Config>("/api/config", 0);
  const pairs = useMemo(() => config?.pairs ?? [], [config]);

  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [desc, setDesc] = useState("");
  const [x, setX] = useState("");
  const [web, setWeb] = useState("");
  const [pair, setPair] = useState("ETH");
  const [mode, setMode] = useState<Mode>("manual");
  const [buy, setBuy] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [plan, setPlan] = useState<Planned[]>([{ name: "", symbol: "", image: null, at: inHours(6) }]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = pairs.find((p) => p.symbol === pair) ?? pairs[0];
  const modeMeta = MODES.find((m) => m.key === mode)!;

  const ready = name.trim() && ticker.trim() && image && (mode !== "scheduled" || plan.every((p) => p.name && p.symbol && p.at));

  const submit = async () => {
    if (!address || !publicClient) return;
    setMsg(null);
    try {
      setBusy("Preparing…");
      const prep = await post<{ token: Address; salt: Hex; uri: string; name: string; symbol: string; modeIndex: number; launchpad: Address; firstBuyWei: string }>("/api/launch/prepare", {
        creator: address,
        name: name.trim(),
        symbol: ticker.trim(),
        description: desc,
        twitter: x,
        website: web,
        image,
        mode,
        firstBuyEth: Number(buy || 0),
        schedule: mode === "scheduled" ? plan.map((p) => ({ ...p, image: p.image ?? undefined, at: new Date(p.at).toISOString() })) : undefined,
      });
      setBusy("Confirm in your wallet…");
      const hash = await writeContractAsync({
        address: prep.launchpad,
        abi: launchpadAbi,
        functionName: "launch",
        args: [prep.name, prep.symbol, prep.uri, prep.modeIndex, prep.salt, 0n],
        value: BigInt(prep.firstBuyWei),
      });
      setBusy("Confirming on-chain…");
      await publicClient.waitForTransactionReceipt({ hash });
      await post("/api/launch/confirm", { token: prep.token, hash });
      router.push(`/specimen/${prep.token}`);
    } catch (e) {
      setMsg(explain(e));
    } finally {
      setBusy(null);
    }
  };

  const sourceIcon = mode === "manual" ? <WalletIcon stroke="#ededed" /> : mode === "auto" ? <TrendIcon stroke="#ededed" /> : mode === "scheduled" ? <TimerIcon stroke="#ededed" /> : <VoteIcon stroke="#ededed" />;
  const sourceLabel = mode === "manual" ? ["you", "sign a message"] : mode === "auto" ? ["keeper", "picks a trending coin"] : mode === "scheduled" ? ["schedule", "time arrives"] : ["holders", "vote closes"];

  return (
    <div className="shell pt-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="kicker">Launch</div>
          <h1 className="display mt-1.5 text-[30px]">New token</h1>
        </div>
        <span className="mono text-[11px] text-ink-faint">ERC-20 · STS-1 bonding curve · paired with ETH · {config?.chain.name.toLowerCase() ?? "robinhood chain"}</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="card p-5">
            <Head n="01" title="Identity at launch" sub="What wallets show first. You can change it later." />
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div>
                <ImageDrop value={image} onChange={setImage} size={148} />
                <div className="mono mt-1.5 w-[148px] text-center text-[10px] text-ink-faint">PNG, JPG, WEBP, GIF · 5 MB</div>
              </div>
              <div className="grid min-w-0 flex-1 content-start gap-3">
                <div className="grid grid-cols-[1fr_140px] gap-3">
                  <div>
                    <label className="label" htmlFor="name">Name</label>
                    <input id="name" className="field" maxLength={32} placeholder="e.g. Shapeshifter" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="ticker">Ticker</label>
                    <input id="ticker" className="field mono" maxLength={10} placeholder="Shift" value={ticker} onChange={(e) => setTicker(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="desc">
                    Description <span className="text-ink-faint">· optional</span>
                  </label>
                  <textarea id="desc" className="field h-[5.5rem] resize-none py-2.5 text-[13.5px] leading-relaxed" maxLength={500} placeholder="What is it, and what might it become?" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  <div className="mono mt-1 text-right text-[10px] text-ink-faint">{desc.length}/500</div>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <Head n="02" title="Socials" sub="Carried into the metadata through every shift." />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="x">X</label>
                <input id="x" className="field" placeholder="Add URL" value={x} onChange={(e) => setX(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="web">Website</label>
                <input id="web" className="field" placeholder="Add URL" value={web} onChange={(e) => setWeb(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <Head n="03" title="Pair with" sub="What the curve trades against. Trades are paid in ETH on Robinhood Chain." />
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {pairs.map((p) => {
                const on = p.symbol === pair;
                return (
                  <button
                    key={p.symbol}
                    type="button"
                    onClick={() => setPair(p.symbol)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${on ? "border-ink bg-card-2" : "border-line hover:border-line-strong hover:bg-card-2"}`}
                  >
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="size-[22px] shrink-0 rounded-full bg-card-2 object-cover" src={p.image} />
                    ) : (
                      <EthIcon className="shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold">{p.symbol}</span>
                      <span className="block truncate text-[10.5px] text-ink-faint">{pairName(p)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <Head n="04" title="Shift mode" sub="How its name, ticker and image change after launch." />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {MODES.map((m) => {
                const on = m.key === mode;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMode(m.key)}
                    className={`cursor-pointer rounded-lg border px-3.5 py-3.5 text-left transition-colors ${on ? "border-ink bg-card-2" : "border-line hover:border-line-strong hover:bg-card-2"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-semibold">{m.label}</span>
                      <span className={`size-3 rounded-full border ${on ? "border-ink bg-ink" : "border-ink-faint"}`} />
                    </div>
                    <div className="mt-1.5 text-[12px] leading-snug text-ink-faint">{m.desc}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-line bg-bg-2">
              <div key={mode} className="animate-rise p-4">
                <div className="flex items-center">
                  <div className="flex w-[104px] shrink-0 flex-col items-center text-center">
                    <div className="flex h-11 items-center justify-center">{sourceIcon}</div>
                    <div className="mono mt-1.5 text-[11px] text-ink">{sourceLabel[0]}</div>
                    <div className="mono text-[9.5px] leading-tight text-ink-faint">{sourceLabel[1]}</div>
                  </div>
                  <Wire label="no fee" />
                  <div className="flex w-[104px] shrink-0 flex-col items-center text-center">
                    <div className="flex h-11 items-center justify-center">
                      <KeyIcon stroke="#ededed" />
                    </div>
                    <div className="mono mt-1.5 text-[11px] text-ink">update authority</div>
                    <div className="mono text-[9.5px] leading-tight text-ink-faint">launchpad signs tx</div>
                  </div>
                  <Wire label="rewrite" />
                  <div className="flex w-[112px] shrink-0 flex-col items-center text-center">
                    <div className="animate-morph size-11 overflow-hidden rounded-lg border border-line-strong bg-card-2">
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={image} className="size-full object-cover" />
                      )}
                    </div>
                    <div className="animate-rise mt-1.5 w-full truncate text-[11.5px] font-semibold">{name || "Your token"} v2</div>
                    <div className="mono w-full truncate text-[10px] text-ink-faint">${ticker || "ticker"}</div>
                  </div>
                </div>
                <p className="mt-3 border-t border-line pt-2.5 text-[12px] leading-relaxed text-ink-faint">{modeMeta.note}</p>
              </div>
            </div>

            {mode === "scheduled" && (
              <div className="mt-3 space-y-2">
                {plan.map((p, i) => (
                  <div key={i} className="grid gap-2 rounded-lg border border-line bg-bg-2 p-3 sm:grid-cols-[56px_1fr_110px_190px_28px]">
                    <ImageDrop value={p.image} onChange={(v) => setPlan((ps) => ps.map((q, j) => (j === i ? { ...q, image: v } : q)))} size={56} compact />
                    <input className="field" maxLength={32} placeholder={`Identity ${i + 1} name`} value={p.name} onChange={(e) => setPlan((ps) => ps.map((q, j) => (j === i ? { ...q, name: e.target.value } : q)))} />
                    <input className="field mono" maxLength={10} placeholder="Ticker" value={p.symbol} onChange={(e) => setPlan((ps) => ps.map((q, j) => (j === i ? { ...q, symbol: e.target.value } : q)))} />
                    <input className="field mono text-[12px]" type="datetime-local" value={p.at} onChange={(e) => setPlan((ps) => ps.map((q, j) => (j === i ? { ...q, at: e.target.value } : q)))} />
                    <button type="button" aria-label="Remove" disabled={plan.length === 1} className="chip cursor-pointer justify-center disabled:opacity-40" onClick={() => setPlan((ps) => ps.filter((_, j) => j !== i))}>
                      ×
                    </button>
                  </div>
                ))}
                {plan.length < 4 && (
                  <button type="button" className="btn btn-sm" onClick={() => setPlan((ps) => [...ps, { name: "", symbol: "", image: null, at: inHours(6 * (ps.length + 1)) }])}>
                    + Add identity ({plan.length}/4)
                  </button>
                )}
                <p className="mono text-[10.5px] text-ink-faint">Leave an image empty to keep the launch image for that identity.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line p-3">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={image} className="size-11 rounded-lg object-cover" />
              ) : (
                <div className="size-11 rounded-lg bg-card-2" />
              )}
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{name || "Untitled"}</div>
                <div className="mono text-[11px] text-ink-soft">
                  ${ticker || "ticker"} · {modeMeta.label} · {selected?.symbol ?? "ETH"} pair
                </div>
              </div>
            </div>
          </section>
          <section className="card p-3">
            <label className="label" htmlFor="buy">First buy (optional)</label>
            <div className="relative">
              <input id="buy" className="field mono pr-16" inputMode="decimal" placeholder="0" value={buy} onChange={(e) => setBuy(e.target.value.replace(/[^0-9.]/g, ""))} />
              <span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-[12px] font-semibold">
                <EthIcon size={14} /> ETH
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-faint">
              <span className="mono">same transaction</span>
              <div className="flex gap-1">
                {["0.1", "0.5", "1"].map((v) => (
                  <button key={v} type="button" onClick={() => setBuy(v)} className="chip cursor-pointer transition-colors hover:border-line-strong hover:text-ink">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {isConnected ? (
              <button type="button" disabled={Boolean(busy) || !ready || !config?.configured} onClick={submit} className="btn btn-ink mt-3 w-full">
                {busy ?? "Launch token"}
              </button>
            ) : (
              <ConnectButton className="btn-ink mt-3" full />
            )}
            {config && !config.configured && <p className="mono mt-2 text-[10.5px] text-red">Launchpad contract is not configured on this deployment.</p>}
            {msg && <p className="mono mt-2 text-[10.5px] text-red">{msg}</p>}
            <p className="mono mt-3 text-[10px] leading-relaxed text-ink-faint">
              One transaction: deploys the STS-1 token (update authority = launchpad), opens its bonding curve, optional first buy. Only gas to pay.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ImageDrop({ value, onChange, size, compact }: { value: string | null; onChange: (v: string) => void; size: number; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const take = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return setErr("5 MB max");
    setErr(null);
    onChange(await fileToDataUrl(f));
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          take(e.dataTransfer.files?.[0]);
        }}
        className="group relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-bg-2 transition-colors hover:border-[#4a4a4a]"
        aria-label="Choose image"
        style={{ width: size, height: size }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={value} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-ink-faint">
            <UploadIcon size={compact ? 14 : 20} />
            {!compact && <span className="text-[11px]">Drop or choose an image</span>}
          </span>
        )}
      </button>
      <input ref={ref} accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" type="file" onChange={(e) => take(e.target.files?.[0])} />
      {err && <div className="mono mt-1 text-[10px] text-red">{err}</div>}
    </div>
  );
}

function Head({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="mono text-[11px] text-ink-faint">{n}</span>
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.01em]">{title}</div>
        <div className="text-[12px] text-ink-faint">{sub}</div>
      </div>
    </div>
  );
}

function Wire({ label }: { label: string }) {
  return (
    <div className="relative mx-1 -mt-8 h-6 min-w-6 flex-1">
      <div className="absolute top-1/2 right-0 left-0 border-t border-dashed border-line-strong" />
      <span className="animate-travel absolute top-1/2 size-1.5 -translate-y-1/2 bg-ink shadow-[0_0_6px_rgb(255_255_255/0.8)]" />
      <span className="mono absolute -top-2 left-1/2 -translate-x-1/2 text-[9.5px] whitespace-nowrap text-ink-faint">{label}</span>
    </div>
  );
}

