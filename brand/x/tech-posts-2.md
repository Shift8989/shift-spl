# 4 posts X sur la tech, série 2 · @shiftspl

Angles pas encore couverts par la série 1. Chaque post a son visuel `post-N-*.png`. Versions EN puis FR.

---

## 7 · Every shift has a number — `post-7-generation.png`

**EN**

Every shift has a number.

A token starts at generation 0. Each rewrite increments it on-chain and emits Shift(generation, name, symbol, uri, by). The `by` tag says who asked: creator, schedule, vote or keeper.

Signatures are bound to the next generation and expire after 5 minutes. Replay an old one and it fails.

Full history, in order, forever.

**FR**

Chaque shift a un numéro.

Un token naît en génération 0. Chaque réécriture l'incrémente on-chain et émet Shift(generation, name, symbol, uri, by). Le tag `by` dit qui a demandé : créateur, programme, vote ou keeper.

Les signatures sont liées à la génération suivante et expirent après 5 minutes. Rejoue-en une ancienne, elle échoue.

L'historique complet, dans l'ordre, pour toujours.

---

## 8 · Know the CA before you sign — `post-8-create2.png`

**EN**

You know the CA before you sign.

Tokens are deployed with CREATE2. The address is derived from the launchpad, your salt and the token bytecode, so the launchpad predicts it before your wallet even opens.

That's why the identity, image and metadata are already live the second the launch transaction lands. No "pending" page, no empty token.

**FR**

Tu connais le CA avant de signer.

Les tokens sont déployés avec CREATE2. L'adresse est dérivée du launchpad, de ton salt et du bytecode du token, donc le launchpad la prédit avant même que ton wallet s'ouvre.

C'est pour ça que l'identité, l'image et les métadonnées sont déjà en ligne à la seconde où la transaction de lancement passe. Pas de page « pending », pas de token vide.

---

## 9 · One link, always current — `post-9-uri.png`

**EN**

One link. Always current.

tokenURI() points at shift-spl.xyz/api/meta/<salt>. That endpoint always serves the token's current name, ticker, image and socials.

Each shift bumps the generation in the URI, so wallets and explorers that cache metadata re-fetch and show the new face. Nothing to migrate, nothing to re-list.

**FR**

Un lien. Toujours à jour.

tokenURI() pointe vers shift-spl.xyz/api/meta/<salt>. Cet endpoint sert toujours le nom, le ticker, l'image et les réseaux actuels du token.

Chaque shift incrémente la génération dans l'URI, donc les wallets et explorers qui mettent les métadonnées en cache re-téléchargent et affichent le nouveau visage. Rien à migrer, rien à re-lister.

---

## 10 · What a shift can never touch — `post-10-untouchable.png`

**EN**

What a shift can never touch.

Address. Supply. Decimals. Balances. Transfers.

shift() writes exactly three fields: name, symbol, tokenURI. It can only be called by the launchpad, which is immutable in the token. There is no owner key on the token, no upgrade path, no mint function.

Your bag is yours. Only the label changes.

**FR**

Ce qu'un shift ne peut jamais toucher.

L'adresse. La supply. Les décimales. Les balances. Les transferts.

shift() écrit exactement trois champs : name, symbol, tokenURI. Seul le launchpad peut l'appeler, et son adresse est immuable dans le token. Pas de clé owner sur le token, pas de chemin d'upgrade, pas de fonction mint.

Ton bag est à toi. Seule l'étiquette change.

---

## Ordre suggéré

10 → 7 → 8 → 9. Commence par ce qui rassure (ce qu'un shift ne touche pas), puis la mécanique (générations), puis les deux détails d'implémentation.

## Notes

- Tout vient du code : ShiftToken.shift() (contracts/ShiftToken.sol), freshEnough à 300 s (lib/server/sig.ts), predictTokenAddress en CREATE2 (lib/server/chain.ts), metaUri avec ?g=<génération> (lib/server/tokens.ts).
- Le post 10 affirme « pas de fonction mint » sur le token : la supply est frappée en une fois au déploiement vers le launchpad. Si le contrat change, relis ce post.
