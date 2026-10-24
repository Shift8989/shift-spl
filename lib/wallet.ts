"use client";

import { Connection, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { WalletContextState } from "@solana/wallet-adapter-react";

/** Sign a server-built transaction (base64) with the wallet, send it and wait for confirmation. */
export async function signAndSend(wallet: WalletContextState, connection: Connection, txBase64: string, lastValidBlockHeight: number) {
  if (!wallet.signTransaction || !wallet.publicKey) throw new Error("Connect a wallet that can sign transactions");
  const tx = Transaction.from(Buffer.from(txBase64, "base64"));
  const signed = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
  const blockhash = tx.recentBlockhash!;
  const res = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (res.value.err) throw new Error(`Transaction failed: ${JSON.stringify(res.value.err)}`);
  return signature;
}

/** Free, off-chain authorization: the wallet signs a plain message the server verifies. */
export async function signMessage(wallet: WalletContextState, message: string) {
  if (!wallet.signMessage || !wallet.publicKey) throw new Error("Connect a wallet that can sign messages");
  const sig = await wallet.signMessage(new TextEncoder().encode(message));
  return { signature: bs58.encode(sig), signer: wallet.publicKey.toBase58() };
}

export function explain(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/User rejected/i.test(m)) return "Signature rejected in the wallet.";
  if (/insufficient|0x1\b/i.test(m)) return "Not enough SOL in the wallet for this transaction.";
  return m;
}

/** Unix seconds, used as a nonce in signed messages. */
export const nowTs = () => Math.floor(Date.now() / 1000);
