import "server-only";
import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler: thrown errors become JSON {error} instead of 500 HTML. */
export function handler<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api]", msg);
      return bad(msg, 500);
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export const isAddress = (s: unknown): s is `0x${string}` => typeof s === "string" && /^0x[0-9a-fA-F]{40}$/.test(s);
export const isHash = (s: unknown): s is `0x${string}` => typeof s === "string" && /^0x[0-9a-fA-F]{64}$/.test(s);
