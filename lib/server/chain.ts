import "server-only";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import bs58 from "bs58";
import {
  DynamicBondingCurveClient,
  buildCurveWithMarketCap,
  deriveDbcPoolAddress,
  getCurrentPoint,
  getPriceFromSqrtPrice,
  TokenType,
  TokenDecimal,
  TokenAuthorityOption,
  BaseFeeMode,
  CollectFeeMode,
  MigrationOption,
  MigrationFeeOption,
  ActivationType,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey as umiPk, transactionBuilder, some, none } from "@metaplex-foundation/umi";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { mplTokenMetadata, updateV1, fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { ENV } from "./env";
import { q, one } from "./db";
import { pairByMint } from "./pairs";

export const BASE_DECIMALS = 6;

/** Shape of the DBC virtual pool account (the SDK's IDL typing collapses it to `any`). */
type PoolState = { config: PublicKey; creator: PublicKey; baseMint: PublicKey; sqrtPrice: BN; quoteReserve: BN; baseReserve: BN; isMigrated: number };
function poolState(p: unknown): PoolState | null {
  if (!p) return null;
  const x = p as { poolState?: PoolState } & PoolState;
  return (x.poolState ?? x) as PoolState;
}
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export const connection = new Connection(ENV.rpcUrl, "confirmed");

let _launchpad: Keypair | null = null;
export function launchpad() {
  if (!_launchpad) {
    if (!ENV.launchpadSecret) throw new Error("LAUNCHPAD_SECRET_KEY is not set");
    _launchpad = Keypair.fromSecretKey(bs58.decode(ENV.launchpadSecret));
  }
  return _launchpad;
}

export const dbc = new DynamicBondingCurveClient(connection, "confirmed");

function curveParams(quoteDecimals: number) {
  return buildCurveWithMarketCap({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: quoteDecimals,
      tokenAuthorityOption: TokenAuthorityOption.PartnerUpdateAuthority, // the launchpad keeps metadata update authority
      totalTokenSupply: ENV.totalSupply,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: { startingFeeBps: ENV.tradingFeeBps, endingFeeBps: ENV.tradingFeeBps, numberOfPeriod: 0, totalDuration: 0 },
      },
      dynamicFeeEnabled: false,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 0,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps100,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
    },
    liquidityDistribution: {
      partnerPermanentLockedLiquidityPercentage: 100,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 0,
      creatorLiquidityPercentage: 0,
    },
    lockedVesting: { totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0, totalVestingDuration: 0, cliffDurationFromMigrationTime: 0 },
    activationType: ActivationType.Timestamp,
    initialMarketCap: ENV.initialMarketCap,
    migrationMarketCap: ENV.migrationMarketCap,
  });
}

/** One DBC config per quote mint, created on first use and signed by the launchpad (partner). */
export async function getOrCreateConfig(quoteMint: string) {
  const row = await one<{ config: string }>(`select config from configs where quote_mint = $1`, [quoteMint]);
  if (row) return row.config;
  const pair = pairByMint(quoteMint);
  if (!pair) throw new Error("Unsupported quote mint");
  const lp = launchpad();
  const configKp = Keypair.generate();
  const tx = await dbc.partner.createConfig({
    config: configKp.publicKey,
    feeClaimer: lp.publicKey,
    leftoverReceiver: lp.publicKey,
    payer: lp.publicKey,
    quoteMint: new PublicKey(quoteMint),
    ...curveParams(pair.decimals),
  });
  const sig = await sendTx(tx, [lp, configKp]);
  await q(`insert into configs(quote_mint, config) values ($1, $2) on conflict (quote_mint) do nothing`, [quoteMint, configKp.publicKey.toBase58()]);
  console.log(`[chain] created DBC config ${configKp.publicKey.toBase58()} for ${pair.symbol} (${sig})`);
  return configKp.publicKey.toBase58();
}

export async function sendTx(tx: Transaction, signers: Keypair[]) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

export function derivePool(quoteMint: string, baseMint: string, config: string) {
  return deriveDbcPoolAddress(new PublicKey(quoteMint), new PublicKey(baseMint), new PublicKey(config)).toBase58();
}

/** Pool creation (+ optional first buy) as an unsigned-by-user transaction. The mint keypair signs here; creator/payer signs in the wallet. */
export async function buildLaunchTx(p: { name: string; symbol: string; uriFor: (mint: string) => string; creator: string; quoteMint: string; firstBuyLamports: number }) {
  const config = await getOrCreateConfig(p.quoteMint);
  const mintKp = Keypair.generate();
  const creator = new PublicKey(p.creator);
  const tx = await dbc.creator.createPoolWithFirstBuy({
    createPoolParam: { baseMint: mintKp.publicKey, config: new PublicKey(config), name: p.name, symbol: p.symbol, uri: p.uriFor(mintKp.publicKey.toBase58()), payer: creator, poolCreator: creator },
    firstBuyParam:
      p.firstBuyLamports > 0 ? { buyer: creator, buyAmount: new BN(p.firstBuyLamports), minimumAmountOut: new BN(1), referralTokenAccount: null } : undefined,
  });
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = creator;
  tx.partialSign(mintKp);
  return {
    mint: mintKp.publicKey.toBase58(),
    config,
    pool: derivePool(p.quoteMint, mintKp.publicKey.toBase58(), config),
    txBase64: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
    lastValidBlockHeight,
  };
}

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

export async function poolLive(poolAddr: string, quoteDecimals: number): Promise<Live | null> {
  const pool = poolState(await dbc.state.getPool(poolAddr));
  if (!pool) return null;
  const cfg = await dbc.state.getPoolConfig(pool.config);
  const price = Number(getPriceFromSqrtPrice(pool.sqrtPrice, TokenDecimal.SIX, quoteDecimals).toString());
  const quoteReserve = Number(pool.quoteReserve.toString()) / 10 ** quoteDecimals;
  const threshold = cfg ? Number(cfg.migrationQuoteThreshold.toString()) / 10 ** quoteDecimals : 0;
  const migrated = pool.isMigrated !== 0;
  return {
    pool: poolAddr,
    priceSol: price,
    supply: ENV.totalSupply,
    marketCapSol: price * ENV.totalSupply,
    quoteReserveSol: quoteReserve,
    thresholdSol: threshold,
    progress: migrated ? 1 : threshold > 0 ? Math.min(1, quoteReserve / threshold) : 0,
    migrated,
    curveComplete: migrated || (threshold > 0 && quoteReserve >= threshold),
  };
}

export async function swapQuote(poolAddr: string, amountIn: BN, swapBaseForQuote: boolean, slippageBps: number) {
  const raw = await dbc.state.getPool(poolAddr);
  const pool = poolState(raw);
  if (!raw || !pool) throw new Error("pool not found");
  const cfg = await dbc.state.getPoolConfig(pool.config);
  if (!cfg) throw new Error("config not found");
  const currentPoint = await getCurrentPoint(connection, cfg.activationType);
  const quote = dbc.pool.swapQuote({ virtualPool: raw, config: cfg, swapBaseForQuote, amountIn, slippageBps, hasReferral: false, eligibleForFirstSwapWithMinFee: false, currentPoint }) as unknown as {
    outputAmount: BN; minimumAmountOut: BN; tradingFee: BN; actualInputAmount: BN;
  };
  return { amountOut: quote.outputAmount, minimumAmountOut: quote.minimumAmountOut, tradingFee: quote.tradingFee, migrated: pool.isMigrated !== 0 };
}

export async function buildSwapTx(p: { pool: string; owner: string; amountIn: BN; minimumAmountOut: BN; swapBaseForQuote: boolean }) {
  const owner = new PublicKey(p.owner);
  const tx = await dbc.pool.swap({ owner, pool: new PublicKey(p.pool), amountIn: p.amountIn, minimumAmountOut: p.minimumAmountOut, swapBaseForQuote: p.swapBaseForQuote, referralTokenAccount: null, payer: owner });
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner;
  return { txBase64: tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"), lastValidBlockHeight };
}

export async function tokenBalance(owner: string, mint: string) {
  try {
    const ata = getAssociatedTokenAddressSync(new PublicKey(mint), new PublicKey(owner), false, TOKEN_PROGRAM_ID);
    const acc = await getAccount(connection, ata, "confirmed");
    return Number(acc.amount) / 10 ** BASE_DECIMALS;
  } catch {
    return 0;
  }
}

export async function solBalance(owner: string) {
  return (await connection.getBalance(new PublicKey(owner), "confirmed")) / LAMPORTS_PER_SOL;
}

/** Confirmed-transaction lookup used to validate client-reported signatures. */
export async function txStatus(signature: string) {
  const r = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
  const s = r.value[0];
  if (!s) return "unknown" as const;
  if (s.err) return "failed" as const;
  return s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized" ? ("confirmed" as const) : ("pending" as const);
}

let _umi: ReturnType<typeof createUmi> | null = null;
function umi() {
  if (!_umi) {
    const u = createUmi(ENV.rpcUrl).use(mplTokenMetadata());
    const kp = u.eddsa.createKeypairFromSecretKey(launchpad().secretKey);
    u.use(keypairIdentity(kp));
    _umi = u;
  }
  return _umi;
}

/** The STS-1 shift: one UpdateMetadataAccountV2 (name, symbol, uri) + memo, signed by the launchpad's update authority. */
export async function rewriteMetadata(mint: string, data: { name: string; symbol: string; uri: string }, memo: string) {
  const u = umi();
  const current = await fetchMetadataFromSeeds(u, { mint: umiPk(mint) });
  const memoIx = new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM, data: Buffer.from(memo, "utf8") });
  const builder = transactionBuilder()
    .add(
      updateV1(u, {
        mint: umiPk(mint),
        authority: u.identity,
        data: some({ name: data.name, symbol: data.symbol, uri: data.uri, sellerFeeBasisPoints: current.sellerFeeBasisPoints, creators: current.creators }),
        isMutable: none(),
        newUpdateAuthority: none(),
      }),
    )
    .add({ instruction: fromWeb3JsInstruction(memoIx), signers: [], bytesCreatedOnChain: 0 });
  const res = await builder.sendAndConfirm(u, { confirm: { commitment: "confirmed" } });
  return bs58.encode(res.signature);
}

export async function readMetadata(mint: string) {
  const m = await fetchMetadataFromSeeds(umi(), { mint: umiPk(mint) });
  return { name: m.name, symbol: m.symbol, uri: m.uri, updateAuthority: m.updateAuthority.toString(), isMutable: m.isMutable };
}
