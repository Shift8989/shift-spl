# shift · shiftable spl

Launchpad for **STS-1** (Shiftable Token Standard) tokens on Solana: SPL tokens whose on-chain name, ticker and image can be rewritten after launch, by the creator, on a schedule, by holder vote, or by following what is trending. Same mint, same balances, new identity in every wallet.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 (`@theme` tokens in `app/globals.css`)
- Fonts: Geist, Geist Mono, Unbounded (brand) via `next/font`
- `@solana/wallet-adapter` (Phantom, Solflare) · `@solana/web3.js`
- `lightweight-charts` for the token chart

## Run

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_RPC_URL` in `.env.local` to use your own Solana RPC.

## Structure

- `app/` pages: `/` home, `/explore` tokens, `/shifts` engine log, `/lab` launch, `/docs` STS-1 spec, `/specimen/[mint]` token page
- `app/api/` JSON API: `specimens`, `specimens/[mint]`, `shifts`, `trending`, `config`, `launch` (stub)
- `components/` UI (shell, cards, hero diagram, launch form, token view, chart, wallet)
- `data/` seed data served by the API until the indexer / keeper backend is connected
