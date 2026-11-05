<p align="center"><img src="brand/x/launch-16x9.png" alt="shift · tokens that rewrite themselves" width="100%" /></p>

# shift · shiftable tokens on Robinhood Chain

**Live:** [shift-spl.xyz](https://shift-spl.xyz) · **Spec:** [STS-1](https://shift-spl.xyz/docs) · **X:** [@shiftspl](https://x.com/shiftspl) · **$SHIFT:** [`0x5abcc2038ceace9e4db05973fea4258b0d4e2d6e`](https://robinhoodchain.blockscout.com/token/0x5abcc2038ceace9e4db05973fea4258b0d4e2d6e) · **License:** MIT

Launchpad for **STS-1** (Shiftable Token Standard) tokens: ERC-20s whose on-chain name, ticker and image can be rewritten after launch, by the creator, on a schedule, by holder vote, or by following what is trending. Same address, same balances, new identity in every wallet.

## How it works

- **Contracts** (`contracts/`): `ShiftToken` is an ERC-20 with mutable `name`/`symbol`/`tokenURI` and one mutator, `shift()`, callable only by the launchpad. `ShiftLaunchpad` deploys tokens with CREATE2, runs a virtual-reserve bonding curve (1.2 ETH / 1.073B virtual, 800M sold then graduation, 1% fee), holds the update authority and exposes `shift()` to its authority key. Compile with `node scripts/compile.mjs`, deploy with `node scripts/deploy.mjs`.
- **Launch** (`/lab`): `/api/launch/prepare` stores the identity, fixes the salt and tokenURI and predicts the token address; the wallet calls `launch()` (optional first buy in ETH); `/api/launch/confirm` verifies the `Launched` event.
- **Trade** (token page): quotes come from the contract's view functions; the wallet calls `buy()` / `sell()` directly; `/api/trade/confirm` records fills from the `Trade` events.
- **Shift**: `ShiftLaunchpad.shift(token, name, symbol, uri, by)` from the authority key. The URI points at `/api/meta/<salt>`, which always serves the current identity.
  - *Manual*: the creator signs a gas-free EIP-191 message, `/api/shift` verifies and rewrites.
  - *Scheduled*: identities planned at launch, applied by the keeper.
  - *Holder vote*: signed proposals and votes (`/api/vote/*`), weighed by balance when the round closes.
  - *Auto · trending*: every keeper run the token becomes a trending memecoin (DexScreener boosts feed).
- **Keeper** (`/api/keeper`, Vercel cron every 5 min, `CRON_SECRET`): schedules, vote rounds, trending, and `migrate()` of graduated curves.
- **Uniswap v4**: Robinhood Chain addresses are in `lib/chain-config.ts`; graduated funds are moved out by the migrator for the v4 pool.

## Stack

Next.js 16 · React 19 · Tailwind v4 · Solidity 0.8 (solc-js) · viem · wagmi (injected wallets: MetaMask, Rabby) · Postgres (Neon) with an embedded PGlite fallback for local dev · `lightweight-charts`.

## Setup

```bash
npm install
cp .env.example .env.local      # fill it
node scripts/compile.mjs
node scripts/deploy.mjs         # writes NEXT_PUBLIC_LAUNCHPAD_ADDRESS to .env.local
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CHAIN` | `robinhood` (4663), `robinhood-testnet` (46630) or `local` (hardhat on 8545) |
| `NEXT_PUBLIC_RPC_URL` | RPC override |
| `NEXT_PUBLIC_BASE_URL` | Public URL, used in tokenURIs |
| `NEXT_PUBLIC_LAUNCHPAD_ADDRESS` | Deployed `ShiftLaunchpad` |
| `LAUNCHPAD_PRIVATE_KEY` | Authority / fee recipient / migrator key: pays gas for every shift and migration |
| `CRON_SECRET` | bearer token for `/api/keeper` |
| `DATABASE_URL` | Postgres (Neon). Without it: PGlite in `.data/` (local only) |

Local end-to-end: start a hardhat node (`npx hardhat node`, chain id 4663), fund the launchpad key, `NEXT_PUBLIC_CHAIN=local node scripts/deploy.mjs`, run the dev server, then `node scripts/e2e.mjs`.

## Layout

- `app/` pages: `/`, `/explore`, `/shifts`, `/lab`, `/docs` (STS-1 spec), `/specimen/[token]`
- `app/api/` launch, trade, shift, vote, keeper, specimens, shifts, trending, config, meta, img, balance
- `contracts/` Solidity + compiled artifacts · `scripts/` compile, deploy, e2e, contract test
- `lib/server/` chain (viem), db, tokens/shifts, keeper, graduate, trending, images · `lib/` chain config, ABIs, client helpers

## Contributing

Issues and pull requests are welcome. Contracts live in `contracts/` (Solidity 0.8, compiled with solc-js via `node scripts/compile.mjs`); run the contract tests with `node scripts/contract-test.mjs` and the end-to-end flow with `node scripts/e2e.mjs` against a local Hardhat node. Never commit `.env.local`, `.data/` or any key: the deployer key pays gas for every shift on mainnet.

## License

MIT. See [LICENSE](LICENSE). Fonts in `assets/fonts` are under the SIL Open Font License (see the license files next to them).

