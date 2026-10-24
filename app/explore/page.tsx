import type { Metadata } from "next";
import { TokenGrid } from "@/components/TokenGrid";

export const metadata: Metadata = { title: "Explore · Shift" };

export default function Explore() {
  return (
    <div className="pt-2">
      <TokenGrid title="All tokens" />
    </div>
  );
}
