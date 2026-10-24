import { ENV } from "@/lib/server/env";
import { runKeeper } from "@/lib/server/keeper";
import { handler, ok, bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Vercel cron (see vercel.json) or manual trigger with the cron secret. */
export const GET = handler(async (req: Request) => {
  const auth = req.headers.get("authorization") ?? "";
  const key = new URL(req.url).searchParams.get("secret") ?? "";
  if (!ENV.cronSecret || (auth !== `Bearer ${ENV.cronSecret}` && key !== ENV.cronSecret)) return bad("unauthorized", 401);
  return ok(await runKeeper());
});
