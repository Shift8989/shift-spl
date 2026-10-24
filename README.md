# shift · shiftable spl

Launchpad for **STS-1** (Shiftable Token Standard) tokens on Solana: SPL tokens whose on-chain name, ticker and image can be rewritten after launch, by the creator, on a schedule, by holder vote, or by following what is trending. Same mint, same balances, new identity in every wallet.

## How it works

- **Launch** (`/lab`): one transaction signed in the user's wallet creates the mint, the Metaplex metadata (mutable, update authority = the launchpad's partner wallet), a Meteora Dynamic Bonding Curve pool, and an optional first buy. The mint keypair is generated and signed server-side (`/api/launch/prepare`), the wallet signs as payer/creator, `/api/launch/confirm` verifies the pool on-chain.
- **Trade** (token page): quotes and swap transactions come from the DBC SDK (`/api/trade/quote`, `/api/trade/tx`); the wallet signs; `/api/trade/confirm` records the fill. Pools graduate to DAMM v2 at the migration threshold.
- **Shift**: `UpdateMetadataAccountV2` (name, symbol, uri) + a `shift:<by>:<generation>` memo, signed by the launchpad. The URI points at `/api/meta/<mint>`, which always serves the current identity.
  - *Manual*: the creator signs a free message (`shift:<mint>:<gen>:<name>:<symbol>:<ts>`), `/api/shift` verifies and rewrites.
  - *Scheduled*: identities planned at launch, applied by the keeper when their time comes.
  - *Holder vote*: proposals and votes are signed messages (`/api/vote/*`), weighed by token balance when the round closes.
  - *Auto · trending*: every keeper run the token becomes a coin trending on Solana (DexScreener boosts feed).
- **Keeper** (`/api/keeper`): Vercel cron every 5 minutes (`vercel.json`), protected by `CRON_SECRET`.

## Stack

Next.js 16 · React 19 · Tailwind v4 · `@meteora-ag/dynamic-bonding-curve-sdk` · `@metaplex-foundation/mpl-token-metadata` (Umi) · `@solana/wallet-adapter` (Phantom, Solflare) · Postgres (Neon) with an embedded PGlite fallback for local dev · `lightweight-charts`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLUSTER` | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC (use a paid RPC on mainnet) |
| `NEXT_PUBLIC_BASE_URL` | Public URL, used in metadata URIs |
| `LAUNCHPAD_SECRET_KEY` | base58 secret key of the launchpad wallet: pays config creation and every shift, holds update authority, claims partner fees |
| `CRON_SECRET` | bearer token for `/api/keeper` |
| `DATABASE_URL` | Postgres connection string (Neon). Without it the app uses PGlite in `.data/` (local only) |

Devnet helpers: `node scripts/devnet-fund.mjs` (airdrops, creates `.data/test-wallet.json`), `node scripts/e2e.mjs` (full flow against a running dev server).

## Layout

- `app/` pages: `/` home, `/explore`, `/shifts` engine log, `/lab` launch, `/docs` STS-1 spec, `/specimen/[mint]` token page
- `app/api/` launch, trade, shift, vote, keeper, specimens, shifts, trending, config, meta, img, balance
- `lib/server/` chain (DBC + Metaplex), db, tokens/shifts, keeper, trending, images, pairs
- `components/` UI
