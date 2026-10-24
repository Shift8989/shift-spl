"use client";

/** Unix seconds, used as a nonce in signed messages. */
export const nowTs = () => Math.floor(Date.now() / 1000);

export function explain(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  const first = m.split("\n")[0];
  if (/User rejected|user denied|rejected the request/i.test(m)) return "Signature rejected in the wallet.";
  if (/insufficient funds/i.test(m)) return "Not enough ETH in the wallet for this transaction.";
  if (/Slippage/i.test(m)) return "Price moved beyond your slippage. Try again.";
  if (/PoolGraduated/i.test(m)) return "This curve has graduated.";
  return first.length > 160 ? first.slice(0, 160) + "…" : first;
}
