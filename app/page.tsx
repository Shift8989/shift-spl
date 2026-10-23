import Link from "next/link";
import { HeroDiagram } from "@/components/HeroDiagram";
import { TokenGrid } from "@/components/TokenGrid";
import { SPECIMENS, TRENDING } from "@/lib/data";

export default function Home() {
  return (
    <>
      <section className="shell pt-10">
        <HeroDiagram trending={TRENDING.slice(0, 8)} />
        <div className="mt-6 text-center">
          <h1 className="display text-[44px] sm:text-[72px]">Tokens that rewrite themselves.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
            Launch an SPL token whose name, ticker and image can change. Shift it yourself whenever you like, set a schedule up front, or let it
            mirror whatever is trending. The launchpad&apos;s update authority does the rewrite on-chain. Same mint, same balances, new identity in
            every wallet.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link className="btn btn-lg btn-ink" href="/lab">
              Launch a token
            </Link>
            <Link className="btn btn-lg" href="/explore">
              See live tokens
            </Link>
          </div>
        </div>
      </section>
      <TokenGrid items={SPECIMENS} title="Launches" />
    </>
  );
}
