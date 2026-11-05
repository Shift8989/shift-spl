import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { Providers } from "@/components/Providers";


const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const unbounded = Unbounded({ subsets: ["latin"], weight: ["700"], variable: "--font-brand" });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://shift-spl.xyz";
const DESCRIPTION =
  "The shiftable token standard (STS-1) on Robinhood Chain. Tokens whose on-chain name, ticker and image can be rewritten after launch: by their creator, on a schedule, by holder vote, or by following the market.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Shift · self-shifting tokens",
  description: DESCRIPTION,
  icons: { icon: "/icon.png" },
  openGraph: {
    type: "website",
    siteName: "shift",
    url: "/",
    title: "shift · tokens that rewrite themselves",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "shift · tokens that rewrite themselves" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@shiftspl",
    creator: "@shiftspl",
    title: "shift · tokens that rewrite themselves",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
