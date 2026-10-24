import "server-only";
import type { Address, Hex } from "viem";
import { verifySignedMessage } from "./chain";

/** Verify an EIP-191 personal_sign signature from the user's wallet. */
export async function verifySigned(message: string, signature: string, address: string) {
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature) || !/^0x[0-9a-fA-F]{40}$/.test(address)) return false;
  return verifySignedMessage(message, signature as Hex, address as Address);
}

/** Signed messages carry a timestamp; reject stale ones to prevent replay. */
export function freshEnough(ts: number, maxAgeSec = 300) {
  return Math.abs(Date.now() / 1000 - ts) <= maxAgeSec;
}
