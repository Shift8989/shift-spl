// End-to-end test against a running dev server (BASE, default http://localhost:3123) on the local hardhat chain:
// launch (prepare → wallet launch() → confirm) → quote → buy → sell → creator shift (signed message) → vote flow → auto token → keeper.
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3123";
const RPC = process.env.RPC ?? "http://127.0.0.1:8545";
const KEY = process.env.KEY ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // hardhat #1
const me = privateKeyToAccount(KEY);
const pub = createPublicClient({ transport: http(RPC) });
const chainId = await pub.getChainId();
const chain = { id: chainId, name: "local", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } };
const wallet = createWalletClient({ account: me, chain, transport: http(RPC) });
const lp = JSON.parse(fs.readFileSync("contracts/out/ShiftLaunchpad.json", "utf8")).abi;
const tk = JSON.parse(fs.readFileSync("contracts/out/ShiftToken.json", "utf8")).abi;
const png = fs.readFileSync("public/tokens/mimic.png");
const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

const api = async (path, body) => {
  const r = await fetch(BASE + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  const j = await r.json();
  if (!r.ok) throw new Error(`${path}: ${j.error ?? r.status}`);
  return j;
};
const sign = (message) => wallet.signMessage({ message });
const write = async (address, abi, functionName, args, value = 0n) => {
  const hash = await wallet.writeContract({ address, abi, functionName, args, value });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${functionName} reverted`);
  return hash;
};
const step = (s) => console.log(`\n== ${s}`);

async function launch(mode, firstBuyEth = 0.01) {
  step(`launch (${mode})`);
  const prep = await api("/api/launch/prepare", { creator: me.address, name: `E2E ${mode}`, symbol: mode.slice(0, 4).toUpperCase(), description: "end-to-end test token", image: dataUrl, mode, firstBuyEth });
  console.log("predicted token", prep.token);
  const hash = await write(prep.launchpad, lp, "launch", [prep.name, prep.symbol, prep.uri, prep.modeIndex, prep.salt, 0n], BigInt(prep.firstBuyWei));
  const conf = await api("/api/launch/confirm", { token: prep.token, hash });
  console.log("launch tx", hash, "status", conf.status);
  return prep.token;
}

const cfg = await api("/api/config");
console.log("chain", cfg.chain.name, cfg.chain.id, "launchpad", cfg.launchpad, "authority", cfg.updateAuthority, "wallet", me.address);

const token = await launch("manual");
step("specimen");
let t = await api(`/api/specimens/${token}`);
console.log(t.name, t.symbol, "price", t.live.priceSol, "ETH · mcap", t.live.marketCapSol.toFixed(3), "ETH · progress", (t.live.progress * 100).toFixed(2) + "% · trades", t.trades.length);

step("buy 0.05 ETH");
const q1 = await api("/api/trade/quote", { mint: token, side: "buy", amount: 0.05, slippageBps: 100 });
console.log("quote →", q1.amountOut.toFixed(0), t.symbol, "fee", q1.tradingFee);
const h1 = await write(cfg.launchpad, lp, "buy", [token, BigInt(q1.minOutWei)], BigInt(q1.amountInWei));
console.log("buy tx", h1, await api("/api/trade/confirm", { mint: token, hash: h1 }));
const bal = await api(`/api/balance?owner=${me.address}&mint=${token}`);
console.log("balance", bal);

step("sell half");
const half = Math.floor(bal.token / 2);
const q2 = await api("/api/trade/quote", { mint: token, side: "sell", amount: half, slippageBps: 100 });
await write(token, tk, "approve", [cfg.launchpad, parseEther(String(half))]);
const h2 = await write(cfg.launchpad, lp, "sell", [token, BigInt(q2.amountInWei), BigInt(q2.minOutWei)]);
console.log("sell tx", h2, "→", q2.amountOut.toFixed(5), "ETH", await api("/api/trade/confirm", { mint: token, hash: h2 }));

step("creator shift (signed message, no gas)");
t = await api(`/api/specimens/${token}`);
const ts = Math.floor(Date.now() / 1000);
const r = await api("/api/shift", { mint: token, name: "Shifted Form", symbol: "FORM2", ts, signer: me.address, signature: await sign(`shift:${token}:${t.generation + 1}:Shifted Form:FORM2:${ts}`) });
console.log("shift tx", r.tx, "generation", r.generation);
const onchain = await pub.readContract({ address: token, abi: tk, functionName: "name" });
t = await api(`/api/specimens/${token}`);
console.log("on-chain name:", onchain, "· api:", t.name, "$" + t.symbol, "· shifts:", t.shifts.length);
console.log("metadata doc", await api(`/api/meta/${t.uri.split("/api/meta/")[1]}`).then((m) => `${m.name} ${m.symbol} ${m.image}`));

step("vote token");
const vm = await launch("vote");
const v = await api(`/api/specimens/${vm}`);
let ts2 = Math.floor(Date.now() / 1000);
const prop = await api("/api/vote/propose", { mint: vm, name: "Voted Form", symbol: "VOTE2", ts: ts2, signer: me.address, signature: await sign(`propose:${vm}:${v.vote.round}:Voted Form:VOTE2:${ts2}`) });
console.log("proposal", prop);
ts2 = Math.floor(Date.now() / 1000);
console.log("vote", await api("/api/vote/cast", { mint: vm, proposalId: prop.id, ts: ts2, signer: me.address, signature: await sign(`vote:${vm}:${v.vote.round}:${prop.id}:${ts2}`) }));

step("auto token + keeper");
await launch("auto");
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
console.log("keeper", await api(`/api/keeper?secret=${env.CRON_SECRET}`));

step("graduation: buy out the curve");
const g = await launch("manual", 0);
const hb = await write(cfg.launchpad, lp, "buy", [g, 0n], parseEther("5"));
await api("/api/trade/confirm", { mint: g, hash: hb });
let gs = await api(`/api/specimens/${g}`);
console.log("graduated:", gs.live.curveComplete, "raised", gs.live.quoteReserveSol.toFixed(3), "ETH of", gs.live.thresholdSol.toFixed(3));
console.log("keeper (migrate)", await api(`/api/keeper?secret=${env.CRON_SECRET}`));
gs = await api(`/api/specimens/${g}`);
console.log("migrated:", gs.live.migrated);

step("lists");
console.log("specimens:", (await api("/api/specimens")).length, "shifts:", (await api("/api/shifts")).length);
console.log("\nE2E OK");
