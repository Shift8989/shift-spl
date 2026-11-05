import type { Metadata } from "next";
import { SpecimenView } from "@/components/SpecimenView";
import { getToken } from "@/lib/server/tokens";
import { MODE_LABEL } from "@/lib/format";

type Props = { params: Promise<{ mint: string }> };

/** Per-token title, description and share card (the image comes from opengraph-image.tsx next to this file). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mint } = await params;
  const t = await getToken(mint).catch(() => null);
  if (!t || t.status !== "live") return { title: `${mint.slice(0, 4)}…${mint.slice(-4)} · Shift` };
  const title = `${t.name} ($${t.symbol}) · shift`;
  const description = (t.description?.trim() || `A ${(MODE_LABEL[t.mode] ?? t.mode).toLowerCase()} STS-1 token on Robinhood Chain. Name, ticker and image can change; the address never does.`).slice(0, 200);
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: `/specimen/${mint}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SpecimenPage({ params }: Props) {
  const { mint } = await params;
  return <SpecimenView mint={mint} />;
}
