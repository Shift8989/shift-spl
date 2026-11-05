# Post X · dev update 3 · cartes de partage par token · @shiftspl

Visuel à joindre : `dev-update-3-16x9.png`

Mieux encore : poste un vrai lien de token (shift-spl.xyz/specimen/0x…) en réponse, X affichera la vraie carte générée.

## Version principale (EN)

Dev update. Every token gets a card.

Share a token link and it unfolds: current name, ticker, image, shift mode, generation, and the tickers it used to be.

Rendered live from the chain state, so the card always shows what the token is right now, not what it was when someone first posted it.

Shift the token, the card shifts with it.

shift-spl.xyz

## Version courte (EN)

Every token on shift now has its own share card: name, ticker, image, mode, generation, former tickers. Rendered live, so it follows every shift.

## Version FR

Dev update. Chaque token a sa carte.

Partage un lien de token et il se déplie : nom actuel, ticker, image, mode de shift, génération, et les tickers qu'il a portés avant.

Rendue en direct depuis l'état on-chain, donc la carte montre toujours ce que le token est maintenant, pas ce qu'il était quand quelqu'un l'a posté.

Shifte le token, la carte shifte avec lui.

shift-spl.xyz

## Réponse suggérée (thread)

How: each token page ships an opengraph-image route rendered on the server with the token's current row and its shift log, in our own type. One link, always current, same idea as the tokenURI.

## Notes

- La carte se génère en moins d'une seconde côté serveur et n'est pas mise en cache, pour refléter le dernier shift.
- Tant qu'aucun token n'est lancé en prod, les liens /specimen renvoient la carte générique du site.
