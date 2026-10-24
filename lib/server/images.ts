import "server-only";
import { randomBytes } from "node:crypto";
import { q, one } from "./db";

const MAX = 5 * 1024 * 1024;

export function imageUrl(id: string | null | undefined) {
  return id ? `/api/img/${id}` : "/logo.png";
}

export async function storeImage(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength > MAX) throw new Error("Image must be 5 MB or less");
  if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(contentType)) throw new Error("Unsupported image type");
  const id = randomBytes(12).toString("hex");
  await q(`insert into images(id, content_type, data_b64) values ($1, $2, $3)`, [id, contentType, Buffer.from(bytes).toString("base64")]);
  return id;
}

export async function storeImageFromDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,([\s\S]+)$/);
  if (!m) throw new Error("Expected a base64 image data URL");
  return storeImage(Buffer.from(m[2], "base64"), m[1]);
}

export async function storeImageFromUrl(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: "image/*" } });
  if (!r.ok) throw new Error(`image fetch failed: ${r.status}`);
  const type = (r.headers.get("content-type") ?? "image/png").split(";")[0];
  return storeImage(new Uint8Array(await r.arrayBuffer()), type);
}

export async function getImage(id: string) {
  const row = await one<{ content_type: string; data_b64: string }>(`select content_type, data_b64 from images where id = $1`, [id]);
  if (!row) return null;
  return { contentType: row.content_type, bytes: Buffer.from(row.data_b64, "base64") };
}
