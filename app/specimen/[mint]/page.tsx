import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpecimen, shiftsFor, SPECIMENS } from "@/lib/data";
import { SpecimenView } from "@/components/SpecimenView";

type Props = { params: Promise<{ mint: string }> };

export function generateStaticParams() {
  return SPECIMENS.map((s) => ({ mint: s.mint }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mint } = await params;
  const s = getSpecimen(mint);
  return { title: s ? `${s.name} ($${s.symbol}) · Shift` : "Shift · self-shifting tokens" };
}

export default async function SpecimenPage({ params }: Props) {
  const { mint } = await params;
  const s = getSpecimen(mint);
  if (!s) notFound();
  return <SpecimenView s={s} shifts={shiftsFor(mint)} />;
}
