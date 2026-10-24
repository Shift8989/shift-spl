import "server-only";
import { createPublicClient, createWalletClient, http, formatEther, parseEther, getContractAddress, encodeAbiParameters, keccak256, concatHex, stringToHex, decodeEventLog, verifyMessage, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN } from "@/lib/chain-config";
import { launchpadAbi, tokenAbi, tokenBytecode } from "@/lib/abi";
import { ENV } from "./env";

export const publicClient = createPublicClient({ chain: CHAIN, transport: http(ENV.rpcUrl, { timeout: 30_000 }), batch: { multicall: CHAIN.id !== 4663 || ENV.chainKey !== "local" } });

export function launchpadAccount() {
  if (!ENV.launchpadKey) throw new Error("LAUNCHPAD_PRIVATE_KEY is not set");
  return privateKeyToAccount(ENV.launchpadKey);
}

let _wallet: ReturnType<typeof createWalletClient> | null = null;
function walletClient() {
  _wallet ??= createWalletClient({ account: launchpadAccount(), chain: CHAIN, transport: http(ENV.rpcUrl, { timeout: 30_000 }) });
  return _wallet;
}

const LP = () => ({ address: ENV.launchpadAddress, abi: launchpadAbi });
export const SUPPLY = parseEther(String(ENV.totalSupply));
export const CURVE_SUPPLY = parseEther(String(ENV.curveSupply));

export type Live = {
  pool: string;
  priceSol: number; // ETH per token (field name kept for the UI)
  supply: number;
  marketCapSol: number;
  quoteReserveSol: number;
  thresholdSol: number;
  progress: number;
  migrated: boolean;
  curveComplete: boolean;
};

const f = (v: bigint) => Number(formatEther(v));

/** Predict the CREATE2 address `launch()` will deploy to, so the token row exists before the user's transaction lands. */
export function predictTokenAddress(p: { name: string; symbol: string; uri: string; creator: Address; salt: Hex }) {
  const ctor = encodeAbiParameters(
    [{ type: "string" }, { type: "string" }, { type: "string" }, { type: "address" }, { type: "uint256" }],
    [p.name, p.symbol, p.uri, p.creator, SUPPLY],
  );
  return getContractAddress({ opcode: "CREATE2", from: ENV.launchpadAddress, salt: p.salt, bytecode: concatHex([tokenBytecode, ctor]) });
}

export function newSalt(creator: Address) {
  return keccak256(stringToHex(`${creator}:${Date.now()}:${Math.random()}`));
}

export async function poolLive(token: Address): Promise<Live | null> {
  const [pool, price] = await Promise.all([
    publicClient.readContract({ ...LP(), functionName: "pools", args: [token] }) as Promise<readonly [Address, number, boolean, boolean, bigint, bigint, { virtualEth: bigint; virtualTokens: bigint; feeBps: number }]>,
    publicClient.readContract({ ...LP(), functionName: "price", args: [token] }) as Promise<bigint>,
  ]);
  if (pool[0] === "0x0000000000000000000000000000000000000000") return null;
  const [, , graduated, migrated, ethReserve, tokensSold, params] = pool;
  // ETH that will have been raised when the curve completes: vE*vT/(vT-curve) - vE
  const vE = params.virtualEth, vT = params.virtualTokens;
  const threshold = (vE * vT) / (vT - CURVE_SUPPLY) - vE;
  const priceEth = f(price);
  return {
    pool: ENV.launchpadAddress,
    priceSol: priceEth,
    supply: ENV.totalSupply,
    marketCapSol: priceEth * ENV.totalSupply,
    quoteReserveSol: f(ethReserve),
    thresholdSol: f(threshold),
    progress: graduated ? 1 : Math.min(1, Number(tokensSold) / Number(CURVE_SUPPLY)),
    migrated,
    curveComplete: graduated,
  };
}

export async function quoteBuy(token: Address, ethIn: bigint) {
  const [tokensOut, ethUsed, fee] = (await publicClient.readContract({ ...LP(), functionName: "quoteBuy", args: [token, ethIn] })) as readonly [bigint, bigint, bigint];
  return { tokensOut, ethUsed, fee };
}

export async function quoteSell(token: Address, tokensIn: bigint) {
  const [ethOut, fee] = (await publicClient.readContract({ ...LP(), functionName: "quoteSell", args: [token, tokensIn] })) as readonly [bigint, bigint];
  return { ethOut, fee };
}

export async function tokenBalance(owner: Address, token: Address) {
  try {
    return f((await publicClient.readContract({ address: token, abi: tokenAbi, functionName: "balanceOf", args: [owner] })) as bigint);
  } catch {
    return 0;
  }
}

export async function ethBalance(owner: Address) {
  return f(await publicClient.getBalance({ address: owner }));
}

export async function txReceipt(hash: Hex) {
  try {
    return await publicClient.getTransactionReceipt({ hash });
  } catch {
    return null;
  }
}

/** Decode our launchpad events from a receipt. */
export function decodeLaunchpadLogs(logs: { data: Hex; topics: Hex[]; address: Address }[]) {
  const out: { eventName: string; args: Record<string, unknown> }[] = [];
  for (const l of logs) {
    if (l.address.toLowerCase() !== ENV.launchpadAddress.toLowerCase()) continue;
    try {
      const d = decodeEventLog({ abi: launchpadAbi, data: l.data, topics: l.topics as [Hex, ...Hex[]] });
      out.push({ eventName: String(d.eventName), args: (d.args ?? {}) as unknown as Record<string, unknown> });
    } catch {
      /* not ours */
    }
  }
  return out;
}

/** The STS-1 shift: ShiftLaunchpad.shift(token, name, symbol, uri, by), signed by the launchpad's authority key. */
export async function rewriteMetadata(token: Address, data: { name: string; symbol: string; uri: string }, by: string) {
  const w = walletClient();
  const hash = await w.writeContract({ ...LP(), functionName: "shift", args: [token, data.name, data.symbol, data.uri, stringToHex(by, { size: 32 })], chain: CHAIN, account: launchpadAccount() });
  const r = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (r.status !== "success") throw new Error("shift transaction reverted");
  return hash;
}

/** After graduation: pull the ETH + unsold tokens out of the curve (then seed the DEX pool, see graduate.ts). */
export async function migratePool(token: Address) {
  const w = walletClient();
  const hash = await w.writeContract({ ...LP(), functionName: "migrate", args: [token], chain: CHAIN, account: launchpadAccount() });
  const r = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (r.status !== "success") throw new Error("migrate reverted");
  return hash;
}

export async function readIdentity(token: Address) {
  const [name, symbol, uri, generation] = await Promise.all([
    publicClient.readContract({ address: token, abi: tokenAbi, functionName: "name" }) as Promise<string>,
    publicClient.readContract({ address: token, abi: tokenAbi, functionName: "symbol" }) as Promise<string>,
    publicClient.readContract({ address: token, abi: tokenAbi, functionName: "tokenURI" }) as Promise<string>,
    publicClient.readContract({ address: token, abi: tokenAbi, functionName: "generation" }) as Promise<bigint>,
  ]);
  return { name, symbol, uri, generation: Number(generation) };
}

export const verifySignedMessage = (message: string, signature: Hex, address: Address) => verifyMessage({ address, message, signature }).catch(() => false);
