import "server-only";
import nacl from "tweetnacl";
import bs58 from "bs58";

/** Verify an ed25519 signature produced by a wallet's signMessage. */
export function verifySigned(message: string, signatureB58: string, pubkeyB58: string) {
  try {
    return nacl.sign.detached.verify(new TextEncoder().encode(message), bs58.decode(signatureB58), bs58.decode(pubkeyB58));
  } catch {
    return false;
  }
}

/** Signed messages carry a timestamp; reject stale ones to prevent replay. */
export function freshEnough(ts: number, maxAgeSec = 300) {
  return Math.abs(Date.now() / 1000 - ts) <= maxAgeSec;
}
