import type { Metadata } from "next";
import { TokenGrid } from "@/components/TokenGrid";
import { SPECIMENS } from "@/lib/data";

export const metadata: Metadata = { title: "Explore · Shift" };

export default function Explore() {
  return (
    <div className="pt-2">
      <TokenGrid items={SPECIMENS} title="All tokens" />
    </div>
  );
}
