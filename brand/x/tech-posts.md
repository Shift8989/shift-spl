# 6 posts X sur la tech · @shiftspl

Un post par jour, ou en thread. Chaque post a son visuel `post-N-*.png`. Versions EN (principales) puis FR.

---

## 1 · One address, any identity — `post-1-identity.png`

**EN**

One address. Any identity.

An STS-1 token is an ERC-20 whose name(), symbol() and tokenURI() are mutable storage, not constructor constants.

Shift it and every wallet, explorer and DEX shows the new name, ticker and image. Same address. Same supply. Nobody moves, nobody claims, nobody migrates.

shift-spl.xyz

**FR**

Une adresse. N'importe quelle identité.

Un token STS-1 est un ERC-20 dont name(), symbol() et tokenURI() sont du storage mutable, pas des constantes de constructeur.

Shifte-le et chaque wallet, explorer et DEX affiche le nouveau nom, ticker et image. Même adresse. Même supply. Personne ne bouge, ne claim, ne migre.

---

## 2 · Four ways to shift — `post-2-modes.png`

**EN**

Four ways to shift. You pick one at launch.

→ Manual: the creator rewrites it whenever, by signing a message
→ Scheduled: up to 4 identities planned at launch, applied on time
→ Holder vote: holders propose and vote each round, the winner is applied
→ Auto · trending: every keeper run, it becomes a memecoin that is trending right now

Whatever the mode, the rewrite is the same single on-chain transaction.

**FR**

Quatre façons de shifter. Tu en choisis une au lancement.

→ Manuel : le créateur réécrit quand il veut, en signant un message
→ Programmé : jusqu'à 4 identités planifiées au lancement, appliquées à l'heure
→ Vote des holders : propositions et votes à chaque round, le gagnant est appliqué
→ Auto · trending : à chaque passage du keeper, le token devient un memecoin trending

Quel que soit le mode, la réécriture est la même transaction on-chain.

---

## 3 · Shift it, pay no gas — `post-3-gasfree.png`

**EN**

Shift it. Pay no gas.

A manual shift is an EIP-191 signed message from the creator wallet:
shift:<token>:<generation>:<name>:<ticker>:<timestamp>

The launchpad verifies the signature, checks the generation, then calls shift() from its authority key and pays the gas.

The creator never sends a transaction to rename their token.

**FR**

Shifte-le. Sans gas.

Un shift manuel est un message signé EIP-191 par le wallet créateur :
shift:<token>:<génération>:<nom>:<ticker>:<timestamp>

Le launchpad vérifie la signature, contrôle la génération, puis appelle shift() depuis sa clé d'autorité et paie le gas.

Le créateur n'envoie jamais de transaction pour renommer son token.

---

## 4 · Holders decide — `post-4-vote.png`

**EN**

Holders decide.

On a vote-mode token, any holder can propose the next name, ticker and image. One proposal per wallet per round.

Votes are signed messages, weighed by balance when the round closes. The winning proposal is applied on-chain by the keeper.

The community literally decides what it holds.

**FR**

Les holders décident.

Sur un token en mode vote, n'importe quel holder peut proposer le prochain nom, ticker et image. Une proposition par wallet et par round.

Les votes sont des messages signés, pondérés par la balance à la clôture du round. La proposition gagnante est appliquée on-chain par le keeper.

La communauté décide littéralement de ce qu'elle détient.

---

## 5 · The keeper never sleeps — `post-5-keeper.png`

**EN**

The keeper never sleeps.

Every 5 minutes it runs through every live token:
→ applies scheduled identities whose time has come
→ closes vote rounds and applies the winner
→ re-skins auto tokens with what is trending on DexScreener
→ migrates graduated curves to Uniswap v4

One authority key, every action on-chain, every run logged.

**FR**

Le keeper ne dort jamais.

Toutes les 5 minutes il passe sur chaque token live :
→ applique les identités programmées dont l'heure est venue
→ clôture les rounds de vote et applique le gagnant
→ re-skinne les tokens auto avec ce qui est trending sur DexScreener
→ migre les courbes graduées vers Uniswap v4

Une clé d'autorité, chaque action on-chain, chaque passage loggé.

---

## 6 · Curve, then Uniswap — `post-6-curve.png`

**EN**

Curve, then Uniswap.

Every shift token launches on a virtual-reserve bonding curve: 1.2 ETH / 1.073B virtual, 800M tokens sold on the curve, 1% trading fee.

Once the curve is bought out, the keeper migrates the raised ETH and the remaining supply to a Uniswap v4 pool.

Identity can change at any point of that journey. The pool doesn't care what the token is called.

**FR**

La courbe, puis Uniswap.

Chaque token shift est lancé sur une bonding curve à réserve virtuelle : 1,2 ETH / 1,073 Md virtuels, 800 M de tokens vendus sur la courbe, 1 % de frais.

Une fois la courbe épuisée, le keeper migre l'ETH levé et la supply restante vers un pool Uniswap v4.

L'identité peut changer à n'importe quel moment de ce parcours. Le pool se fiche du nom du token.

---

## Ordre suggéré

1 → 2 → 3 → 4 → 5 → 6, un par jour. Le 1 pose le concept, le 2 les modes, les 3 à 5 détaillent chaque mécanisme, le 6 ferme sur la liquidité. Chaque post peut se terminer par « shift-spl.xyz » ou citer le post de lancement.
