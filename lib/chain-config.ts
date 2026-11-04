import { defineChain, type Address } from "viem";

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain-testnet.blockscout.com" } },
  testnet: true,
});

export const localChain = defineChain({
  id: 4663,
  name: "Local (hardhat)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});

export type ChainKey = "robinhood" | "robinhood-testnet" | "local";
export const CHAIN_KEY = (process.env.NEXT_PUBLIC_CHAIN ?? "robinhood") as ChainKey;
export const CHAIN = CHAIN_KEY === "robinhood-testnet" ? robinhoodTestnet : CHAIN_KEY === "local" ? localChain : robinhood;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? CHAIN.rpcUrls.default.http[0];
export const LAUNCHPAD_ADDRESS = (process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as Address;
export const EXPLORER = CHAIN.blockExplorers!.default.url;

/** Uniswap v4 on Robinhood Chain (developers.uniswap.org/contracts/v4/deployments). */
export const V4 = {
  poolManager: "0x8366a39cc670b4001a1121b8f6a443a643e40951" as Address,
  positionManager: "0x58daec3116aae6d93017baaea7749052e8a04fa7" as Address,
  stateView: "0xf3334192d15450cdd385c8b70e03f9a6bd9e673b" as Address,
  quoter: "0x8dc178efb8111bb0973dd9d722ebeff267c98f94" as Address,
  universalRouter: "0x8876789976decbfcbbbe364623c63652db8c0904" as Address,
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address,
};

/** The project token, deployed on Robinhood Chain (not a launchpad token). */
export const SHIFT_TOKEN = { address: "0x5abcc2038ceace9e4db05973fea4258b0d4e2d6e" as Address, symbol: "SHIFT", name: "Shift SPL" };

export const explorerUrl = (kind: "tx" | "address" | "token", id: string) => `${EXPLORER}/${kind}/${id}`;
