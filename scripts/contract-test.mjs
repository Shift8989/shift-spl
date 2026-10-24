// Exercises the launchpad on a local node: launch (+first buy), buy, sell, shift, buy to graduation, migrate.
import { createPublicClient, createWalletClient, http, parseEther, formatEther, decodeEventLog, keccak256, toHex, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "node:fs";

const RPC = process.env.RPC ?? "http://127.0.0.1:8545";
const KEY = process.env.KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // hardhat #0
const ADDR = process.env.ADDR;
const account = privateKeyToAccount(KEY);
const pub = createPublicClient({ transport: http(RPC) });
const chainId = await pub.getChainId();
const chain = { id: chainId, name: "local", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } };
const wallet = createWalletClient({ account, chain, transport: http(RPC) });
const lp = JSON.parse(fs.readFileSync("contracts/out/ShiftLaunchpad.json", "utf8"));
const tk = JSON.parse(fs.readFileSync("contracts/out/ShiftToken.json", "utf8"));
const c = { address: ADDR, abi: lp.abi };
const send = async (fn, args, value = 0n) => {
  const hash = await wallet.writeContract({ ...c, functionName: fn, args, value });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${fn} reverted`);
  return r;
};
const read = (fn, args) => pub.readContract({ ...c, functionName: fn, args });

const salt = keccak256(stringToHex("test-" + Date.now()));
const r = await send("launch", ["Test Form", "FORM", "http://localhost/api/meta/x", 0, salt, 0n], parseEther("0.01"));
const launched = r.logs.map((l) => { try { return decodeEventLog({ abi: lp.abi, data: l.data, topics: l.topics }); } catch { return null; } }).find((e) => e?.eventName === "Launched");
const token = launched.args.token;
console.log("launched", token, "gas", r.gasUsed.toString());
const bal = (a) => pub.readContract({ address: token, abi: tk.abi, functionName: "balanceOf", args: [a] });
console.log("first buy →", formatEther(await bal(account.address)), "tokens; price", formatEther(await read("price", [token])), "ETH/token");

const q = await read("quoteBuy", [token, parseEther("0.5")]);
console.log("quote 0.5 ETH →", formatEther(q[0]), "tokens, fee", formatEther(q[2]));
await send("buy", [token, (q[0] * 99n) / 100n], parseEther("0.5"));
console.log("after buy balance", formatEther(await bal(account.address)));

const half = (await bal(account.address)) / 2n;
await wallet.writeContract({ address: token, abi: tk.abi, functionName: "approve", args: [ADDR, half] });
const qs = await read("quoteSell", [token, half]);
await send("sell", [token, half, (qs[0] * 99n) / 100n]);
console.log("sold half for ~", formatEther(qs[0]), "ETH; balance", formatEther(await bal(account.address)));

await send("shift", [token, "Shifted", "SHFT", "http://localhost/api/meta/x?g=1", stringToHex("creator", { size: 32 })]);
const name = await pub.readContract({ address: token, abi: tk.abi, functionName: "name" });
const gen = await pub.readContract({ address: token, abi: tk.abi, functionName: "generation" });
console.log("after shift:", name, "generation", gen.toString());

// buy the rest of the curve in one go (overpay; contract refunds the excess)
const before = await pub.getBalance({ address: account.address });
const big = await send("buy", [token, 0n], parseEther("20"));
const after = await pub.getBalance({ address: account.address });
const pool = await read("pools", [token]);
console.log("graduated:", pool[2], "ethReserve", formatEther(pool[4]), "tokensSold", formatEther(pool[5]), "spent", formatEther(before - after));
try { await send("buy", [token, 0n], parseEther("0.01")); console.log("ERROR: buy after graduation succeeded"); } catch { console.log("buy after graduation reverts ✓"); }
const m = await send("migrate", [token]);
console.log("migrated, launchpad token balance now", formatEther(await bal(ADDR)), "migrator balance", formatEther(await bal(account.address)));
console.log("CONTRACT TEST OK");
