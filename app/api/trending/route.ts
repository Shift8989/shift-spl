import { getTrending } from "@/lib/server/trending";
import { handler, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const GET = handler(async () => ok(await getTrending()));
