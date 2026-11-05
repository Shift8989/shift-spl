import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getToken, shiftsFor } from "@/lib/server/tokens";
import { getImage } from "@/lib/server/images";
import { MODE_LABEL } from "@/lib/format";

// One share card per token: current identity, mode, generation and former tickers.
export const alt = "A shiftable token on shift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

const fontsDir = join(process.cwd(), "assets/fonts");
const unbounded = await readFile(join(fontsDir, "unbounded-latin-700-normal.woff"));
const geist = await readFile(join(fontsDir, "geist-sans-latin-600-normal.woff"));
const geistMono = await readFile(join(fontsDir, "geist-mono-latin-400-normal.woff"));
const icon = await readFile(join(process.cwd(), "public/icon.png"));
const iconUri = `data:image/png;base64,${icon.toString("base64")}`;

const INK = "#ededed", SOFT = "#9b9b9b", FAINT = "#5f5f5f", LINE = "#2f2f2f", BG = "#0d0d0d", CARD = "#141414";

async function tokenImage(id: string | null) {
  if (!id) return iconUri;
  const img = await getImage(id);
  if (!img || img.contentType === "image/svg+xml") return iconUri;
  return `data:${img.contentType};base64,${img.bytes.toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const t = await getToken(mint);
  const fonts = [
    { name: "Unbounded", data: unbounded, style: "normal" as const, weight: 700 as const },
    { name: "Geist", data: geist, style: "normal" as const, weight: 600 as const },
    { name: "Geist Mono", data: geistMono, style: "normal" as const, weight: 400 as const },
  ];

  if (!t || t.status !== "live") {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: BG, display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
          <img src={iconUri} width={200} height={200} style={{ borderRadius: 56 }} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Unbounded", fontSize: 120, color: INK, letterSpacing: -6, lineHeight: 1 }}>shift</div>
            <div style={{ fontFamily: "Geist", fontSize: 34, color: SOFT, marginTop: 18 }}>Tokens that rewrite themselves.</div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const [image, shifts] = await Promise.all([tokenImage(t.image_id), shiftsFor(mint)]);
  const former = [...new Set(shifts.map((s) => s.fromSymbol))].filter((s) => s && s !== t.symbol).slice(0, 3);
  const desc = (t.description ?? "").trim();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: BG, display: "flex", flexDirection: "column", padding: 56, fontFamily: "Geist", color: INK }}>
        <div style={{ display: "flex", flex: 1, gap: 56, alignItems: "center" }}>
          <img src={image} width={400} height={400} style={{ borderRadius: 40, objectFit: "cover", border: `2px solid ${LINE}`, background: CARD }} alt="" />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ fontFamily: "Geist Mono", fontSize: 20, color: SOFT, border: `1px solid ${LINE}`, background: CARD, borderRadius: 10, padding: "8px 14px", textTransform: "lowercase" }}>{MODE_LABEL[t.mode] ?? t.mode}</div>
              <div style={{ fontFamily: "Geist Mono", fontSize: 20, color: SOFT, border: `1px solid ${LINE}`, background: CARD, borderRadius: 10, padding: "8px 14px" }}>
                {shifts.length === 0 ? "generation 0" : `${shifts.length} shift${shifts.length > 1 ? "s" : ""} · gen ${t.generation}`}
              </div>
            </div>
            <div style={{ fontFamily: "Unbounded", fontSize: t.name.length > 14 ? 56 : 76, lineHeight: 1.05, letterSpacing: -3, marginTop: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontFamily: "Geist Mono", fontSize: 36, color: SOFT, marginTop: 8 }}>{`$${t.symbol}`}</div>
            {desc ? (
              <div style={{ fontSize: 26, color: SOFT, marginTop: 22, lineHeight: 1.35, overflow: "hidden", maxHeight: 72 }}>{desc.length > 110 ? desc.slice(0, 107) + "…" : desc}</div>
            ) : null}
            {former.length ? (
              <div style={{ fontFamily: "Geist Mono", fontSize: 22, color: FAINT, marginTop: 22 }}>{`formerly ${former.map((s) => `$${s}`).join(" · ")}`}</div>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${LINE}`, paddingTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={iconUri} width={40} height={40} style={{ borderRadius: 12 }} alt="" />
            <div style={{ fontFamily: "Unbounded", fontSize: 30, letterSpacing: -1.5 }}>shift</div>
            <div style={{ fontFamily: "Geist Mono", fontSize: 18, color: FAINT, marginLeft: 8, letterSpacing: 2 }}>STS-1 · ROBINHOOD CHAIN</div>
          </div>
          <div style={{ fontFamily: "Geist Mono", fontSize: 22, color: SOFT }}>shift-spl.xyz</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
