import type { Metadata } from "next";
import { LaunchForm } from "@/components/LaunchForm";

export const metadata: Metadata = { title: "Launch · Shift" };

export default function Lab() {
  return <LaunchForm />;
}
