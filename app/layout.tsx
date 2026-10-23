import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { WalletProvider } from "@/components/WalletProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const unbounded = Unbounded({ subsets: ["latin"], weight: ["700"], variable: "--font-brand" });

export const metadata: Metadata = {
  title: "Shift · self-shifting tokens",
  description:
    "The shiftable SPL token standard. Tokens whose on-chain name, ticker and image can be rewritten after launch: by their creator, on a schedule, or by following the market.",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full">
        <WalletProvider>
          <Shell>{children}</Shell>
        </WalletProvider>
      </body>
    </html>
  );
}
