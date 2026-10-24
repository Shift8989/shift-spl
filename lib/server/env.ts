import "server-only";
import { CHAIN_KEY, RPC_URL, LAUNCHPAD_ADDRESS } from "@/lib/chain-config";

export const ENV = {
  chainKey: CHAIN_KEY,
  rpcUrl: RPC_URL,
  launchpadAddress: LAUNCHPAD_ADDRESS,
  launchpadKey: (process.env.LAUNCHPAD_PRIVATE_KEY ?? "") as `0x${string}` | "",
  cronSecret: process.env.CRON_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3123"),
  keeperIntervalMin: Number(process.env.KEEPER_INTERVAL_MIN ?? 30),
  voteRoundMin: Number(process.env.VOTE_ROUND_MIN ?? 60),
  totalSupply: 1_000_000_000,
  curveSupply: 800_000_000,
  tradingFeeBps: 100,
};
