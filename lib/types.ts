export type Mode = "manual" | "auto" | "scheduled" | "vote";

export type Pair = { symbol: string; image: string | null } | null;

export type Live = {
  pool: string;
  priceSol: number;
  supply: number;
  marketCapSol: number;
  quoteReserveSol: number;
  thresholdSol: number;
  progress: number;
  migrated: boolean;
  curveComplete: boolean;
};

export type Specimen = {
  mint: string;
  pool: string;
  creator: string;
  generation: number;
  form_count: number;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  description: string | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  first_buy_lamports: number;
  status: string;
  signature: string;
  last_mutation_at: string | null;
  dormant_reason: string | null;
  created_at: string;
  mode: Mode;
  mirror_mint: string | null;
  quote_mint: string | null;
  pair: Pair;
  live: Live;
  next: string | null;
};

export type Shift = {
  at: string;
  mint: string;
  fromSymbol: string;
  fromImage: string;
  toName: string;
  toSymbol: string;
  toImage: string;
  by: "keeper" | "creator" | "schedule" | "vote";
  tx: string;
};

export type Trending = {
  mint: string;
  name: string;
  symbol: string;
  image: string;
  marketCapUsd: number;
  source: string;
};

export type PairConfig = {
  quoteMint: string;
  symbol: string;
  name: string;
  decimals: number;
  image: string | null;
  kind: "sol" | "stock";
  config: string;
};

export type Config = {
  configured: boolean;
  config: string;
  quoteMint: string;
  quoteDecimals: number;
  baseDecimals: number;
  thresholdSol: number;
  creatorTradingFeePercentage: number;
  mutable: boolean;
  solQuoted: boolean;
  solUsd: number;
  keeperIntervalMin: number;
  voteRoundMin: number;
  pairs: PairConfig[];
};
