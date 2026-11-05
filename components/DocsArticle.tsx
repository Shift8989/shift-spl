const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[14.5px] leading-[1.75] text-ink-soft">{children}</p>;
const K = ({ children }: { children: React.ReactNode }) => <span className="mono text-[12px] font-semibold tracking-[0.06em] text-ink">{children}</span>;
const C = ({ children }: { children: React.ReactNode }) => <code className="mono rounded border border-line bg-card px-1 py-0.5 text-[12px] text-ink">{children}</code>;
const H2 = ({ id, n, title }: { id: string; n: string; title: string }) => (
  <h2 id={id} className="group mt-16 scroll-mt-24 border-t border-line pt-10 text-[26px] font-semibold tracking-[-0.035em] first:mt-0 first:border-t-0 first:pt-0">
    <a href={`#${id}`} className="flex cursor-pointer items-baseline gap-3">
      <span className="mono text-[12px] font-normal text-ink-faint">{n}</span>
      <span>{title}</span>
      <span className="mono text-[14px] text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">#</span>
    </a>
  </h2>
);
const H3 = ({ id, title }: { id: string; title: string }) => (
  <h3 id={id} className="group mt-10 scroll-mt-24 text-[17px] font-semibold tracking-[-0.02em]">
    <a href={`#${id}`} className="cursor-pointer">
      {title}
      <span className="mono ml-2 text-[12px] text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">#</span>
    </a>
  </h3>
);
const Pre = ({ children }: { children: string }) => (
  <div className="term mt-4">
    <pre className="no-scrollbar overflow-x-auto p-3 text-[12.5px] leading-relaxed">
      <code className="mono text-ink-soft">{children}</code>
    </pre>
  </div>
);
const Table = ({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) => (
  <div className="no-scrollbar mt-4 overflow-x-auto rounded-xl border border-line">
    <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
      <thead>
        <tr className="border-b border-line bg-card">
          {head.map((h) => (
            <th key={h} className="mono px-3 py-2 text-[10.5px] font-normal tracking-[0.1em] text-ink-faint uppercase">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line align-top last:border-b-0">
            {r.map((c, j) => (
              <td key={j} className={`px-3 py-2.5 ${j === 0 ? "text-ink" : "text-ink-soft"}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
const Faq = ({ q, a }: { q: string; a: string }) => (
  <details className="card group p-4 [&_summary::-webkit-details-marker]:hidden">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-semibold">
      {q}
      <span className="text-[18px] text-ink-faint transition-transform group-open:rotate-45">+</span>
    </summary>
    <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{a}</p>
  </details>
);

export function DocsArticle() {
  return (
    <article className="max-w-[760px] min-w-0 pb-24">
      <H2 id="abstract" n="01" title="Abstract" />
      <P>
        A token&apos;s identity on an EVM chain lives in its contract: a name, a symbol, and, for tokens that have one, a metadata URI pointing at an image and description. Almost every ERC-20 freezes those values in the constructor. STS-1 does the opposite. It specifies tokens that are born shiftable, the four ways a shift can be requested, the single transaction that performs it, and the guarantees that hold across every rewrite.
      </P>
      <P>
        The result is a token that can tell a story over time. It can be one thing at launch and another at graduation, change on a creator&apos;s command, be voted into its next form by its holders, or continuously become whatever the market is watching. Holders never move, never migrate, never claim. The token they hold simply becomes something new.
      </P>

      <H2 id="motivation" n="02" title="Motivation" />
      <P>
        Memecoins are narratives, and narratives move faster than a fixed ticker. Today a project that wants a new identity has two options: deploy a new token and ask everyone to move, or live with the old one. Both lose. Liquidity fragments, holders are left behind, and the history that made the token valuable is gone.
      </P>
      <P>
        Nothing in the EVM prevents a contract from exposing <C>name()</C> and <C>symbol()</C> as mutable storage. What was missing is a standard: who may rewrite them, when, how it is authorized, what it may never touch, and how anyone watching can follow along. STS-1 is that standard, deployed on Robinhood Chain.
      </P>

      <H2 id="terminology" n="03" title="Terminology" />
      <P>
        The key words <K>MUST</K>, <K>MUST NOT</K>, <K>SHOULD</K> and <K>MAY</K> are to be read as described in RFC 2119.
      </P>
      <Table
        head={["Term", "Meaning"]}
        rows={[
          ["Shiftable token", "An ERC-20 deployed by the launchpad under STS-1, whose name, symbol and tokenURI are mutable and controlled by the launchpad."],
          ["Identity", "The triple (name, symbol, tokenURI) a token currently presents, plus the image and description behind the URI."],
          ["Shift", "A single transaction that rewrites a token's identity. Numbered by generation, starting at 1."],
          ["Generation", "A counter on the token, incremented by every shift. Generation 0 is the launch identity."],
          ["Update authority", "The launchpad contract. It is the only caller allowed to shift a token, and it only does so on behalf of an authorized source."],
          ["Authority key", "The launchpad's operator account. It submits shift transactions after verifying who asked."],
          ["Creator", "The wallet that launched the token. In manual mode, the only wallet that may ask for a shift."],
          ["Keeper", "The launchpad's scheduler. Applies planned identities, closes vote rounds, and mirrors trending coins."],
          ["Curve", "The bonding curve every STS-1 token is born on. 800M of the 1B supply are sold on it before graduation."],
        ]}
      />

      <H2 id="token" n="04" title="The shiftable token" />
      <H3 id="token-mint" title="Supply and address" />
      <P>
        A shiftable token is deployed by the launchpad with <C>CREATE2</C>, so its address is known before the launch transaction lands. The whole supply (1,000,000,000 tokens, 18 decimals) is minted once, to the launchpad, which sells 800,000,000 on the curve and keeps 200,000,000 for the graduation pool. There is no mint function. Supply, decimals, creator and address <K>MUST NOT</K> change.
      </P>
      <H3 id="token-metadata" title="Mutable identity" />
      <P>
        <C>name</C>, <C>symbol</C> and <C>tokenURI</C> are storage variables, not constants. The contract exposes one mutator, <C>shift(name, symbol, uri, by)</C>, callable only by the launchpad. Transfers, approvals and balances are standard ERC-20 and <K>MUST</K> behave identically before and after a shift.
      </P>
      <Pre>{`contract ShiftToken {
  string  public name;       // mutable
  string  public symbol;     // mutable
  string  public tokenURI;   // mutable
  uint8   public constant decimals = 18;
  uint256 public immutable totalSupply;
  address public immutable launchpad;  // update authority
  address public immutable creator;
  uint256 public generation;

  event Shift(uint256 indexed generation, string name, string symbol, string uri, bytes32 by);

  function shift(string calldata name_, string calldata symbol_, string calldata uri_, bytes32 by) external;
}`}</Pre>
      <H3 id="token-identity" title="Identity" />
      <P>
        Wallets and explorers that read <C>name()</C> and <C>symbol()</C> see the new identity on the next refresh. Indexers that cache names <K>SHOULD</K> subscribe to the <C>Shift</C> event. The image and description are served from the URI, which the launchpad keeps pointing at a document that always reflects the current generation.
      </P>
      <H3 id="token-json" title="Off-chain document" />
      <P>The tokenURI resolves to a JSON document. Its shape is stable across shifts; only the values change.</P>
      <Pre>{`{
  "name": "Shapeshifter",
  "symbol": "SHIFT",
  "image": "https://shift-spl.xyz/api/img/…",
  "description": "What it is, and what it might become.",
  "token": "0x…",
  "createdOn": "https://shift-spl.xyz",
  "twitter": "https://x.com/…",
  "website": "https://…",
  "attributes": [
    { "trait_type": "Standard", "value": "STS-1" },
    { "trait_type": "Shifts", "value": 3 },
    { "trait_type": "Mode", "value": "scheduled" }
  ]
}`}</Pre>

      <H2 id="shift" n="05" title="Shifts" />
      <H3 id="shift-tx" title="The transaction" />
      <P>
        Every shift is one call to <C>ShiftLaunchpad.shift(token, name, symbol, uri, by)</C> from the authority key. The launchpad forwards it to the token, which increments its generation and emits <C>Shift</C>; the launchpad emits <C>Shifted</C> with the same data so a single contract can be watched for every token. The <C>by</C> field is a 32-byte tag naming the source: <C>creator</C>, <C>schedule</C>, <C>vote</C> or <C>keeper</C>.
      </P>
      <Pre>{`ShiftLaunchpad.shift(token, name, symbol, uri, by)
  └─ ShiftToken.shift(name, symbol, uri, by)   // msg.sender == launchpad
       generation += 1
       name, symbol, tokenURI ← new identity
       emit Shift(generation, name, symbol, uri, by)
  emit Shifted(token, generation, name, symbol, uri, by)`}</Pre>
      <P>Before the transaction is built, the new image (if any) and the new metadata document are stored, so the URI is live the moment the shift lands.</P>
      <H3 id="shift-invariants" title="Invariants" />
      <Table
        head={["Field", "Rule"]}
        rows={[
          ["address, totalSupply, decimals, creator", "MUST NOT change. There is no code path that can change them."],
          ["balances, allowances", "MUST NOT be touched by a shift."],
          ["name, symbol", "MAY change on every shift. 1–32 and 1–10 characters respectively."],
          ["tokenURI", "MAY change. It MUST resolve to the document above for the current generation."],
          ["generation", "MUST increase by exactly one per shift."],
          ["update authority", "MUST remain the launchpad. The token has no way to transfer it."],
        ]}
      />
      <H3 id="shift-generations" title="Generations" />
      <P>
        The launch identity is generation 0. Each shift produces generation n+1. The token page and the engine log list every generation with the transaction that produced it, so the full history of a token is reconstructible from chain data alone: scan <C>Shifted</C> events on the launchpad.
      </P>

      <H2 id="modes" n="06" title="Shift modes" />
      <P>The mode is chosen at launch and recorded on the pool. It decides who may ask for a shift.</P>
      <H3 id="mode-manual" title="Manual" />
      <P>
        The creator asks, whenever they like, by signing a message with their wallet. No gas is spent by the creator: the launchpad verifies the signature and submits the shift. Message format: <C>shift:&lt;token&gt;:&lt;generation+1&gt;:&lt;name&gt;:&lt;symbol&gt;:&lt;timestamp&gt;</C>. The timestamp <K>MUST</K> be within five minutes and the generation <K>MUST</K> match the current one plus one, so a captured signature cannot be replayed.
      </P>
      <H3 id="mode-scheduled" title="Scheduled" />
      <P>
        Up to four identities are planned at launch, each with a time. The keeper applies them in order as their time arrives, then stops. Planned identities are visible on the token page before they take effect.
      </P>
      <H3 id="mode-auto" title="Auto · trending" />
      <P>
        Every keeper interval (30 minutes), the token takes the name, ticker and image of a coin that is trending right now. The trending source is a public market feed; the keeper picks the top entry that differs from the current identity. Nobody signs; the launchpad does the rewrite.
      </P>
      <H3 id="mode-vote" title="Holder vote" />
      <P>
        Rounds last 60 minutes. During a round, holders propose identities and vote by signing messages (one proposal and one vote per wallet per round). When the round closes, the keeper weighs each vote by the voter&apos;s token balance at that moment and applies the winner. A round with no proposals changes nothing.
      </P>

      <H2 id="authorization" n="07" title="Creator authorization" />
      <P>
        Manual shifts, proposals and votes are authorized with EIP-191 signed messages, never with transactions, so the people asking pay no gas. The launchpad <K>MUST</K> verify that the recovered signer is the creator (manual) or holds a non-zero balance (vote), that the timestamp is fresh, and that the message binds the token, the round or generation, and the exact identity requested.
      </P>

      <H2 id="keeper" n="08" title="The keeper" />
      <P>
        The keeper runs every five minutes. On each run it applies due schedules, closes finished vote rounds, mirrors trending for auto tokens whose interval has elapsed, and migrates graduated curves. Runs are serialized with a time-boxed lock so two keepers never shift the same token twice. Every run is logged with what it did.
      </P>

      <H2 id="concurrency" n="09" title="Concurrency and safety" />
      <P>
        Shifts are idempotent per generation: the signed message for a manual shift names the generation it expects, and the keeper reads the current generation before acting. If two sources race, the second one fails its check and nothing is written twice. The authority key only ever calls <C>shift</C> and <C>migrate</C>; it cannot mint, freeze, or move holder balances.
      </P>

      <H2 id="lifecycle" n="10" title="Launch lifecycle" />
      <Table
        head={["Step", "What happens"]}
        rows={[
          ["1. Prepare", "The launchpad stores the image, fixes a salt and the tokenURI, and predicts the token address with CREATE2."],
          ["2. Launch", "The creator's wallet calls launch(name, symbol, uri, mode, salt) with an optional first buy in ETH. One transaction deploys the token and opens the curve."],
          ["3. Trade", "Anyone buys with ETH or sells back to the curve. Price follows a constant-product curve with virtual reserves; 1% fee."],
          ["4. Shift", "The identity changes according to the mode, any number of times, before or after graduation."],
          ["5. Graduate", "When 800M tokens have been sold, the curve closes. The raised ETH and the remaining 200M tokens seed the Uniswap v4 pool."],
        ]}
      />

      <H2 id="market" n="11" title="Market structure" />
      <P>
        The curve holds virtual reserves of 1.2 ETH and 1,073,000,000 tokens at launch (an initial market cap of about 1.1 ETH). Buying moves ETH in and tokens out along <C>x·y = k</C>; selling does the reverse. The curve completes when 800,000,000 tokens have left it, which raises about 3.5 ETH. At that point trading on the curve stops and the pool graduates to Uniswap v4 on Robinhood Chain, where the token trades freely with the rest of the chain&apos;s liquidity.
      </P>
      <Pre>{`virtualEth    = 1.2 ETH + ethRaised
virtualTokens = 1,073,000,000 − tokensSold
tokensOut     = virtualTokens − k / (virtualEth + ethIn·(1 − fee))
graduation    : tokensSold == 800,000,000  (≈ 3.5 ETH raised)`}</Pre>

      <H2 id="trust" n="12" title="Trust model" />
      <P>
        Holders trust the launchpad with exactly one thing: the identity. The launchpad can rename a token; it cannot take it. Balances, supply and the address are enforced by the token contract, and the authority key has no path to them. The curve contract holds ETH only until graduation, and the code that moves it out is the migration into the public pool. Everything the launchpad does is an on-chain event that anyone can audit.
      </P>

      <H2 id="integrate" n="13" title="Integrating" />
      <H3 id="integrate-detect" title="Detecting STS-1 tokens" />
      <P>
        An STS-1 token is any contract deployed by the launchpad: check <C>ShiftLaunchpad.pools(token).creator != 0</C>, or scan <C>Launched</C> events. The token itself reports <C>launchpad()</C> and <C>generation()</C>.
      </P>
      <H3 id="integrate-index" title="Indexing shifts" />
      <P>
        Subscribe to <C>Shifted(token, generation, name, symbol, uri, by)</C> on the launchpad to follow every rewrite on the platform, or to <C>Shift</C> on a single token. Refresh cached names when you see one.
      </P>
      <H3 id="integrate-api" title="HTTP API" />
      <Table
        head={["Endpoint", "Returns"]}
        rows={[
          [<C key="a">GET /api/specimens</C>, "Every live token with its current identity, mode, and curve state."],
          [<C key="b">GET /api/specimens/:token</C>, "One token with its shift history, trades, planned identities and the current vote round."],
          [<C key="c">GET /api/shifts</C>, "The engine log: every shift across the platform, newest first."],
          [<C key="d">GET /api/meta/:salt</C>, "The metadata document behind a token's URI."],
          [<C key="e">GET /api/trending</C>, "What the keeper would mirror right now."],
          [<C key="f">GET /api/config</C>, "Chain, launchpad address, authority, intervals, curve parameters."],
        ]}
      />

      <H2 id="faq" n="14" title="FAQ" />
      <div className="mt-4 space-y-2">
        <Faq q="Do I need to do anything when a token I hold shifts?" a="No. Same token, same balance, same address. Your wallet shows the new name and image the next time it refreshes the token." />
        <Faq q="Can the launchpad take my tokens?" a="No. The launchpad can only call shift() on the token, which changes name, symbol and tokenURI. Transfers and balances are standard ERC-20 code with no admin path." />
        <Faq q="Does a shift cost the creator anything?" a="No. The creator signs a message; the launchpad pays the gas for the on-chain rewrite." />
        <Faq q="What happens after graduation?" a="Trading moves to a Uniswap v4 pool on Robinhood Chain seeded with the raised ETH and the remaining 200M tokens. The token keeps shifting according to its mode." />
        <Faq q="Which chain is this on?" a="Robinhood Chain (chain id 4663), an Arbitrum Orbit L2. Gas is paid in ETH." />
      </div>

      <H2 id="versioning" n="15" title="Versioning" />
      <P>
        This document describes STS-1 revision 2026-10-24. Changes that alter the invariants in section 05 would be a new major version (STS-2). Additions that keep them, such as new shift modes or new curve parameters, are revisions of STS-1 and are dated.
      </P>
    </article>
  );
}
