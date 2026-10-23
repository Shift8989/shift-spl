import type { Metadata } from "next";
import Link from "next/link";
import sections from "@/data/docs-sections.json";
import { DocsArticle } from "@/components/DocsArticle";
import { DocsToc, type Section } from "@/components/DocsToc";

export const metadata: Metadata = { title: "Documentation · Shift" };

export default function Docs() {
  const secs = sections as Section[];
  return (
    <div className="shell pt-8">
      <header className="relative overflow-hidden rounded-2xl border border-line bg-card px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.03)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_70%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">STS-1</span>
            <span className="chip">status · live on mainnet</span>
            <span className="chip">revision 2026-10-24</span>
          </div>
          <h1 className="mt-5 text-[34px] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[46px]">The Shiftable Token Standard</h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-soft">
            STS-1 defines SPL tokens whose on-chain identity is not fixed at birth. A shiftable token keeps one mint, one supply and every holder&apos;s
            balance for life, while its name, ticker and image can be rewritten: by its creator, on a schedule set at launch, or by following the market.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-ink" href="/lab">
              Launch an STS-1 token
            </Link>
            <a href="#integrate" className="btn">
              Integrate
            </a>
          </div>
        </div>
      </header>
      <div className="mt-6 xl:hidden">
        <DocsToc sections={secs} variant="mobile" />
      </div>
      <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_240px]">
        <DocsArticle />
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <DocsToc sections={secs} variant="desktop" />
          </div>
        </aside>
      </div>
    </div>
  );
}
