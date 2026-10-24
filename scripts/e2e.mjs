// End-to-end test against a running dev server (default http://localhost:3123) using the local test wallet:
// launch (prepare → sign → send → confirm) → quote → buy → sell → creator shift (signed message) → keeper → vote flow on a second token.
import { Connection, Keypair, Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3123";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => l.split("=")));
const conn = new Connection(env.NEXT_PUBLIC_RPC_URL, "confirmed");
const me = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(".data/test-wallet.json", "utf8"))));
const pub = me.publicKey.toBase58();
const png = fs.readFileSync("public/tokens/mimic.png");
const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

const api = async (path, body) => {
  const r = await fetch(BASE + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  const j = await r.json();
  if (!r.ok) throw new Error(`${path}: ${j.error ?? r.status}`);
  return j;
};
const sign = (msg) => bs58.encode(nacl.sign.detached(new TextEncoder().encode(msg), me.secretKey));
const send = async (txBase64, lastValidBlockHeight) => {
  const tx = Transaction.from(Buffer.from(txBase64, "base64"));
  tx.partialSign(me);
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await conn.confirmTransaction({ signature: sig, blockhash: tx.recentBlockhash, lastValidBlockHeight }, "confirmed");
  return sig;
};
const step = (s) => console.log(`\n== ${s}`);

async function launch(mode, extra = {}) {
  step(`launch (${mode})`);
  const prep = await api("/api/launch/prepare", { creator: pub, name: `E2E ${mode}`, symbol: mode.slice(0, 4).toUpperCase(), description: "end-to-end test token", image: dataUrl, quoteMint: "So11111111111111111111111111111111111111112", mode, firstBuyLamports: 50_000_000, ...extra });
  console.log("mint", prep.mint, "pool", prep.pool);
  const sig = await send(prep.txBase64, prep.lastValidBlockHeight);
  console.log("launch tx", sig);
  const conf = await api("/api/launch/confirm", { mint: prep.mint, signature: sig });
  console.log("status", conf.status);
  return prep.mint;
}

const cfg = await api("/api/config");
console.log("cluster", cfg.cluster, "authority", cfg.updateAuthority, "wallet", pub);

const mint = await launch("manual");
step("specimen");
let t = await api(`/api/specimens/${mint}`);
console.log(t.name, t.symbol, "mcap", t.live.marketCapSol.toFixed(2), "SOL · progress", (t.live.progress * 100).toFixed(2) + "%");

step("buy 0.05 SOL");
const q1 = await api("/api/trade/quote", { mint, side: "buy", amount: 0.05, slippageBps: 100 });
console.log("quote →", q1.amountOut.toFixed(0), t.symbol);
const tx1 = await api("/api/trade/tx", { mint, side: "buy", amount: 0.05, slippageBps: 100, owner: pub });
const s1 = await send(tx1.txBase64, tx1.lastValidBlockHeight);
await api("/api/trade/confirm", { mint, signature: s1, side: "buy", quoteAmount: 0.05, baseAmount: tx1.expectedOut, trader: pub });
console.log("buy tx", s1);
const bal = await api(`/api/balance?owner=${pub}&mint=${mint}`);
console.log("balance", bal);

step("sell half");
const half = Math.floor(bal.token / 2);
const tx2 = await api("/api/trade/tx", { mint, side: "sell", amount: half, slippageBps: 100, owner: pub });
const s2 = await send(tx2.txBase64, tx2.lastValidBlockHeight);
await api("/api/trade/confirm", { mint, signature: s2, side: "sell", quoteAmount: tx2.expectedOut, baseAmount: half, trader: pub });
console.log("sell tx", s2, "→", tx2.expectedOut.toFixed(4), "SOL");

step("creator shift (signed message, no fee)");
t = await api(`/api/specimens/${mint}`);
const ts = Math.floor(Date.now() / 1000);
const r = await api("/api/shift", { mint, name: "Shifted Form", symbol: "FORM2", ts, signer: pub, signature: sign(`shift:${mint}:${t.generation + 1}:Shifted Form:FORM2:${ts}`) });
console.log("shift tx", r.tx, "generation", r.generation);
t = await api(`/api/specimens/${mint}`);
console.log("now", t.name, "$" + t.symbol, "shifts:", t.shifts.length);
const meta = await api(`/api/meta/${mint}?g=${t.generation}`);
console.log("metadata doc", meta.name, meta.symbol, meta.image);

step("vote token");
const vm = await launch("vote");
let ts2 = Math.floor(Date.now() / 1000);
const v = await api(`/api/specimens/${vm}`);
const prop = await api("/api/vote/propose", { mint: vm, name: "Voted Form", symbol: "VOTE2", ts: ts2, signer: pub, signature: sign(`propose:${vm}:${v.vote.round}:Voted Form:VOTE2:${ts2}`) });
console.log("proposal", prop);
ts2 = Math.floor(Date.now() / 1000);
console.log("vote", await api("/api/vote/cast", { mint: vm, proposalId: prop.id, ts: ts2, signer: pub, signature: sign(`vote:${vm}:${v.vote.round}:${prop.id}:${ts2}`) }));

step("auto token + keeper");
await launch("auto");
console.log("keeper", await api(`/api/keeper?secret=${env.CRON_SECRET}`));

step("lists");
console.log("specimens:", (await api("/api/specimens")).length, "shifts:", (await api("/api/shifts")).length);
console.log("\nE2E OK");
