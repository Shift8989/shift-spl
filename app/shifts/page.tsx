import type { Metadata } from "next";
import { ShiftLog } from "@/components/ShiftLog";

export const metadata: Metadata = { title: "Shifts · Shift" };

export default function Shifts() {
  return (
    <div className="shell pt-10">
      <div className="kicker">Engine log</div>
      <h1 className="display mt-2 text-[30px]">Shifts</h1>
      <p className="mt-2 max-w-xl text-[14px] text-ink-soft">Every on-chain identity rewrite across the platform, by the creator, a schedule, the holders, or the keeper.</p>
      <ShiftLog />
    </div>
  );
}
