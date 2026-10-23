import type { Metadata } from "next";
import { LaunchForm } from "@/components/LaunchForm";
import { CONFIG } from "@/lib/data";

export const metadata: Metadata = { title: "Launch · Shift" };

export default function Lab() {
  return <LaunchForm config={CONFIG} />;
}
