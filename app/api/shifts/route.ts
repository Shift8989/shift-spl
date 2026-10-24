import { shiftsFor } from "@/lib/server/tokens";
import { handler, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const GET = handler(async () => ok(await shiftsFor(), { headers: { "cache-control": "no-store" } }));
