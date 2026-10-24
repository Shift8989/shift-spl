import "server-only";
import { ENV } from "./env";

export type PairDef = { quoteMint: string; symbol: string; name: string; decimals: number; image: string | null; kind: "sol" | "stock" };

const SOL: PairDef = { quoteMint: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana", decimals: 9, image: null, kind: "sol" };

const X = (sym: string, name: string, mint: string): PairDef => ({
  quoteMint: mint,
  symbol: sym,
  name,
  decimals: 8,
  image: `https://xstocks-metadata.backed.fi/logos/tokens/${sym}.png`,
  kind: "stock",
});

const MAINNET: PairDef[] = [
  SOL,
  X("AAPLx", "Apple xStock", "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp"),
  X("AMZNx", "Amazon.com xStock", "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg"),
  X("COINx", "Coinbase xStock", "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu"),
  X("CRCLx", "Circle xStock", "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1"),
  X("GLDx", "Gold xStock", "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re"),
  X("GMEx", "Gamestop xStock", "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc"),
  X("GOOGLx", "Alphabet xStock", "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN"),
  X("HOODx", "Robinhood xStock", "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg"),
  X("METAx", "Meta xStock", "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu"),
  X("MSFTx", "Microsoft xStock", "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX"),
  X("MSTRx", "MicroStrategy xStock", "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ"),
  X("NVDAx", "NVIDIA xStock", "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh"),
  X("QQQx", "Nasdaq xStock", "Xs8S1uUs1zsS2p5bwCn4b3kCTv2oNfQ5d5m9gc8fRzU"),
  X("SPYx", "SP500 xStock", "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W"),
  X("TSLAx", "Tesla xStock", "XsDoVfqeBukxuZHWZdvPsXS2uJ6N5R2VEjgyXMAu8DW"),
  { quoteMint: "TTWofwAge91oFhZs7kpQdyrVRkmevgM88xijGvQFbKo", symbol: "TTWO", name: "Take-Two Interactive", decimals: 6, image: "https://backpack.exchange/api/stock-logo/TTWO", kind: "stock" },
];

export const PAIRS: PairDef[] = ENV.cluster === "devnet" ? [SOL] : MAINNET;

export function pairByMint(quoteMint: string) {
  return PAIRS.find((p) => p.quoteMint === quoteMint) ?? null;
}
