import specimens from "@/data/specimens.json";
import shifts from "@/data/shifts.json";
import trending from "@/data/trending.json";
import config from "@/data/config.json";
import type { Specimen, Shift, Trending, Config } from "./types";

/** Route IPFS images through the local proxy (public gateways rate-limit and block cross-origin embeds). */
export function img(url: string) {
  const m = url.match(/^https?:\/\/[^/]+\/ipfs\/([a-zA-Z0-9]+)/);
  return m ? `/api/img/${m[1]}` : url;
}

export const SPECIMENS = (specimens as Specimen[]).map((s) => ({ ...s, image: img(s.image) }));
export const SHIFTS = (shifts as Shift[]).map((s) => ({ ...s, fromImage: img(s.fromImage), toImage: img(s.toImage) }));
export const TRENDING = trending as Trending[];
export const CONFIG = config as Config;

export function getSpecimen(mint: string) {
  return SPECIMENS.find((s) => s.mint === mint) ?? null;
}

export function shiftsFor(mint: string) {
  return SHIFTS.filter((s) => s.mint === mint);
}
