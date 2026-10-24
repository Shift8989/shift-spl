import { getTokenBySalt } from "@/lib/server/tokens";
import { imageUrl } from "@/lib/server/images";
import { ENV } from "@/lib/server/env";
import { handler, ok, bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Off-chain metadata document behind each token's tokenURI. Always serves the current identity. */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ salt: string }> }) => {
  const { salt } = await ctx.params;
  const t = await getTokenBySalt(salt);
  if (!t) return bad("not found", 404);
  return ok(
    {
      name: t.name,
      symbol: t.symbol,
      description: t.description ?? "",
      image: `${ENV.baseUrl}${imageUrl(t.image_id)}`,
      token: t.mint,
      createdOn: ENV.baseUrl,
      twitter: t.twitter ?? undefined,
      website: t.website ?? undefined,
      attributes: [
        { trait_type: "Standard", value: "STS-1" },
        { trait_type: "Shifts", value: t.generation },
        { trait_type: "Mode", value: t.mode },
      ],
    },
    { headers: { "cache-control": "public, max-age=30" } },
  );
});
