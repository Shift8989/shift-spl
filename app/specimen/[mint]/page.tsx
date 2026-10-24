import type { Metadata } from "next";
import { SpecimenView } from "@/components/SpecimenView";

type Props = { params: Promise<{ mint: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mint } = await params;
  return { title: `${mint.slice(0, 4)}…${mint.slice(-4)} · Shift` };
}

export default async function SpecimenPage({ params }: Props) {
  const { mint } = await params;
  return <SpecimenView mint={mint} />;
}
