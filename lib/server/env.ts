import "server-only";

const cluster = (process.env.NEXT_PUBLIC_CLUSTER ?? "devnet") as "devnet" | "mainnet-beta";

export const ENV = {
  cluster,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? (cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com"),
  launchpadSecret: process.env.LAUNCHPAD_SECRET_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3123"),
  keeperIntervalMin: Number(process.env.KEEPER_INTERVAL_MIN ?? 30),
  voteRoundMin: Number(process.env.VOTE_ROUND_MIN ?? 60),
  /** curve shape, in quote-token units (SOL) */
  initialMarketCap: Number(process.env.CURVE_INITIAL_MCAP ?? 30),
  migrationMarketCap: Number(process.env.CURVE_MIGRATION_MCAP ?? 420),
  totalSupply: 1_000_000_000,
  tradingFeeBps: 100,
};
