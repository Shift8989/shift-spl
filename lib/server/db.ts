import "server-only";
import { ENV } from "./env";

export type Row = Record<string, unknown>;
type Query = (text: string, params?: unknown[]) => Promise<Row[]>;

let queryImpl: Promise<Query> | null = null;

async function init(): Promise<Query> {
  if (ENV.databaseUrl) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(ENV.databaseUrl);
    return async (text, params = []) => (await sql.query(text, params)) as Row[];
  }
  // No DATABASE_URL: embedded PGlite under .data/ (local dev). On Vercel this lands in /tmp and does not persist: set DATABASE_URL there.
  const { PGlite } = await import("@electric-sql/pglite");
  const g = globalThis as unknown as { __pglite?: InstanceType<typeof PGlite> };
  const dir = process.env.VERCEL ? "/tmp/pglite" : ".data/pglite";
  if (process.env.VERCEL) console.warn("[db] DATABASE_URL is not set: using ephemeral PGlite in /tmp");
  g.__pglite ??= new PGlite(dir);
  const db = g.__pglite;
  return async (text, params = []) => (await db.query(text, params)).rows as Row[];
}

const SCHEMA = `
create table if not exists tokens (
  mint text primary key,
  pool text not null,
  config text not null,
  quote_mint text not null,
  pair_symbol text not null,
  creator text not null,
  name text not null,
  symbol text not null,
  uri text not null,
  image_id text,
  description text,
  twitter text,
  website text,
  mode text not null,
  generation int not null default 0,
  status text not null default 'draft',
  signature text,
  first_buy_lamports bigint not null default 0,
  created_at timestamptz not null default now(),
  last_shift_at timestamptz
);
create table if not exists shifts (
  id serial primary key,
  mint text not null,
  generation int not null,
  from_name text not null, from_symbol text not null, from_image text,
  to_name text not null, to_symbol text not null, to_image text,
  by_ text not null,
  tx text not null,
  at timestamptz not null default now()
);
create index if not exists shifts_mint on shifts(mint);
create table if not exists schedules (
  id serial primary key,
  mint text not null,
  idx int not null,
  name text not null, symbol text not null, image_id text,
  at timestamptz not null,
  done boolean not null default false
);
create table if not exists proposals (
  id serial primary key,
  mint text not null,
  round bigint not null,
  proposer text not null,
  name text not null, symbol text not null, image_id text,
  created_at timestamptz not null default now(),
  unique(mint, round, proposer)
);
create table if not exists votes (
  id serial primary key,
  mint text not null,
  round bigint not null,
  voter text not null,
  proposal_id int not null,
  created_at timestamptz not null default now(),
  unique(mint, round, voter)
);
create table if not exists vote_rounds (
  mint text not null,
  round bigint not null,
  resolved_at timestamptz not null default now(),
  winner_proposal_id int,
  primary key(mint, round)
);
create table if not exists images (
  id text primary key,
  content_type text not null,
  data_b64 text not null,
  created_at timestamptz not null default now()
);
create table if not exists trades (
  id serial primary key,
  mint text not null,
  signature text not null unique,
  side text not null,
  quote_amount double precision not null,
  base_amount double precision not null,
  price double precision not null,
  trader text not null,
  at timestamptz not null default now()
);
create index if not exists trades_mint on trades(mint);
create table if not exists configs (
  quote_mint text primary key,
  config text not null,
  created_at timestamptz not null default now()
);
create table if not exists locks (
  name text primary key,
  until timestamptz not null
);
create table if not exists keeper_runs (
  id serial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  detail text
);
`;

let schemaReady: Promise<void> | null = null;

export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  queryImpl ??= init();
  const run = await queryImpl;
  schemaReady ??= (async () => {
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await run(stmt);
  })();
  await schemaReady;
  return (await run(text, params)) as T[];
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/** Best-effort distributed lock (single row, time-boxed). Returns true when acquired. */
export async function acquireLock(name: string, seconds: number) {
  const rows = await q<{ name: string }>(
    `insert into locks(name, until) values ($1, now() + ($2 || ' seconds')::interval)
     on conflict (name) do update set until = excluded.until where locks.until < now()
     returning name`,
    [name, String(seconds)],
  );
  return rows.length > 0;
}

export async function releaseLock(name: string) {
  await q(`delete from locks where name = $1`, [name]);
}
