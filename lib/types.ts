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
  last_shift_at: string | null;
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

export type Trade = { signature: string; side: "buy" | "sell"; quote_amount: number; base_amount: number; price: number; trader: string; at: string };

export type Proposal = { id: number; name: string; symbol: string; image: string; proposer: string; created_at: string; votes: number };

export type ScheduleItem = { idx: number; name: string; symbol: string; image: string; at: string; done: boolean };

export type SpecimenDetail = Specimen & {
  shifts: Shift[];
  trades: Trade[];
  vote: { round: number; closesAt: number; proposals: Proposal[]; voters: string[] } | null;
  schedule: ScheduleItem[];
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
  config: string | null;
};

export type Config = {
  configured: boolean;
  chain: { key: string; id: number; name: string; explorer: string; rpc: string };
  launchpad: string;
  updateAuthority: string | null;
  ethUsd: number;
  keeperIntervalMin: number;
  voteRoundMin: number;
  tradingFeeBps: number;
  curveSupply: number;
  totalSupply: number;
  pairs: PairConfig[];
};
