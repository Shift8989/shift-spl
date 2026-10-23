"use client";

import { useEffect, useRef, useState } from "react";
import type { Trending } from "@/lib/types";
import { mintShort } from "@/lib/format";

const W = 1000;
const H = 290;

const SOURCES = [
  { key: "keeper", hint: "mirrors a trending coin" },
  { key: "creator", hint: "shifts any time" },
  { key: "schedule", hint: "+6h after launch" },
] as const;

const PATHS = [
  "M 236 132 L 300 132",
  "M 470 112 C 506 112, 506 62, 540 62",
  "M 750 62 L 790 62",
  "M 895 104 L 895 170",
  "M 790 214 L 750 214",
];

const DOTS: [number, number][] = [
  [236, 132], [300, 132], [470, 112], [540, 62], [750, 62], [790, 62], [895, 104], [895, 170], [790, 214], [750, 214],
];

const STEPS = ["authority", "metadata", "wallets", "holders"] as const;

export function HeroDiagram({ trending }: { trending: Trending[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [scale, setScale] = useState(1);
  const [tick, setTick] = useState(0);
  const [dot, setDot] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // phase 0..4 : source lit → authority → metadata → wallets → holders ; a cycle = 5 phases
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1100);
    return () => clearInterval(id);
  }, []);

  const cycle = Math.floor(tick / 5);
  const phase = tick % 5;
  const source = SOURCES[cycle % SOURCES.length];
  const coin = trending.length ? trending[cycle % trending.length] : null;
  const gen = (cycle % 6) + 1;
  const activePath = phase - 1; // path index lit during this phase (0..3), -1 for source phase
  const litStep = phase >= 1 ? STEPS[phase - 1] : null;

  // moving glow dot along the active path
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const idx = activePath >= 0 && activePath < 4 ? activePath : 0;
    const p = pathRefs.current[idx];
    if (!p || activePath < 0) {
      setDot(null);
      return;
    }
    const len = p.getTotalLength();
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const pt = p.getPointAtLength(t * len);
      setDot({ x: pt.x, y: pt.y });
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activePath, tick]);

  const stroke = (i: number) => (i === activePath ? "#ffffff" : i < activePath ? "#7a7a7a" : i === 0 && activePath === -1 ? "#7a7a7a" : "#333333");

  const boxStyle = (step: (typeof STEPS)[number], left: number, top: number): React.CSSProperties => ({
    left,
    top,
    width: 210,
    height: 84,
    borderColor: litStep === step ? "rgba(255,255,255,0.55)" : "rgb(34,34,34)",
    boxShadow: litStep === step ? "rgba(255,255,255,0.3) 0px 0px 28px -8px" : "none",
  });

  const name = coin?.name ?? "Shapeshifter";
  const symbol = coin?.symbol ?? "SHIFT";
  const image = coin?.image ?? "/logo.png";

  return (
    <div
      ref={wrap}
      className="relative w-full"
      style={{ height: H * scale }}
      role="img"
      aria-label="Diagram: the creator, a schedule or the keeper asks for a shift; the launchpad's update authority signs; the token's metadata account is rewritten; every wallet shows the new name and image while the mint and balances stay the same."
    >
      <div className="absolute top-0 left-1/2 origin-top" style={{ width: W, height: H, transform: `translateX(-50%) scale(${scale})` }}>
        <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
          {PATHS.map((d, i) => (
            <path
              key={d}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={d}
              stroke={stroke(i)}
              strokeWidth="1.5"
              strokeDasharray="2 6"
              strokeLinecap="round"
              style={{ transition: "stroke 300ms ease" }}
            />
          ))}
          {DOTS.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x - 2.5} y={y - 2.5} width="5" height="5" fill="#8a8a8a" />
          ))}
          {dot && <rect x={dot.x - 4} y={dot.y - 4} width="8" height="8" fill="#ffffff" style={{ filter: "drop-shadow(rgba(255,255,255,0.8) 0px 0px 6px)" }} />}
        </svg>

        <div className="card absolute overflow-hidden" style={{ left: 30, top: 66, width: 206 }}>
          <div className="kicker border-b border-line px-3 py-2">shift sources</div>
          {SOURCES.map((s) => {
            const on = s.key === source.key;
            return (
              <div key={s.key} className={`flex items-center gap-2.5 border-b border-line px-3 py-2 transition-colors last:border-b-0 ${on ? "bg-card-2" : ""}`}>
                <span className={`size-1.5 shrink-0 rounded-full ${on ? "bg-ink" : "bg-line-strong"}`} />
                <span className={`mono text-[12px] ${on ? "text-ink" : "text-ink-faint"}`}>{s.key}</span>
                <span className="mono ml-auto truncate text-[10px] text-ink-faint">{s.hint}</span>
              </div>
            );
          })}
        </div>

        <div className="absolute flex flex-col items-center" style={{ left: 300, top: 22, width: 170 }}>
          <div className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 150, height: 150 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={image} alt={symbol} className={`animate-mutate shrink-0 rounded-xl bg-bg-2 object-cover`} src={image} style={{ width: 150, height: 150 }} />
          </div>
          <div className="mono mt-3 w-full truncate text-center text-[12px] text-ink">
            {name} <span className="text-ink-soft">${symbol}</span>
          </div>
          <div className="mono text-[10.5px] text-ink-faint">SPL mint {mintShort("7xKpQ2mN4vR8sT1uW3yZ5aB6cD9eF0gH2jK4mN6pQ3FqA")}</div>
        </div>

        <Box style={boxStyle("authority", 540, 20)} tag="authority" title="signs" sub="launchpad holds update authority" k={cycle} />
        <Box style={boxStyle("metadata", 790, 20)} tag="metadata" title={`v${gen}`} sub={`name · symbol · uri → $${symbol}`} k={cycle} />
        <Box style={boxStyle("wallets", 790, 170)} tag="wallets" title={name} sub="new identity everywhere it's shown" k={cycle} image={image} />
        <Box style={boxStyle("holders", 540, 170)} tag="holders" title="same mint" sub="balances never move" k={cycle} />

        <div className="mono absolute text-[10.5px] text-ink-faint" style={{ left: 540, top: 266 }}>
          UpdateMetadataAccountV2 · one transaction · {source.key} triggered
        </div>
      </div>
    </div>
  );
}

function Box({ style, tag, title, sub, k, image }: { style: React.CSSProperties; tag: string; title: string; sub: string; k: number; image?: string }) {
  return (
    <div className="absolute flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-[border-color,box-shadow] duration-300" style={style}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={k} alt="" className="animate-rise size-9 shrink-0 rounded-md object-cover" src={image} />
      )}
      <div className="min-w-0 flex-1">
        <div key={k} className="mono animate-rise truncate pr-14 text-[17px] font-semibold tracking-[-0.02em]">
          {title}
        </div>
        <div className="mono mt-1 truncate text-[10.5px] text-ink-faint">{sub}</div>
      </div>
      <span className="mono absolute top-2.5 right-2.5 rounded border border-line bg-card-2 px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-ink-soft uppercase">{tag}</span>
    </div>
  );
}
