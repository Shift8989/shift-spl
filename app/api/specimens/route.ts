import { listSpecimens } from "@/lib/server/tokens";
import { handler, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 200), 200);
  return ok(await listSpecimens(limit), { headers: { "cache-control": "no-store" } });
});
