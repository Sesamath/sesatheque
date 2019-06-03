Notes pour les développeurs
===========================

Dans toute la doc, on utilise pnpm, mais vous pouvez utiliser npm ou yarn si vous préférez.

Installation
------------

Cf ../INSTALL.md

Développement
-------------

Back :
- `pnpm start:devBack` va lancer le serveur node avec reload à chaque modif (sans rebuild du code client)
- Pour éviter un reload à chaque modif, mais le déclencher manuellement, ça peut être pratique de lancer un `while true; do pnpm run start; done` et relancer avec un ctrl+c 

Front: `pnpm run start:devFront` va lancer webpack-dev-server sur le port 3001 
(pour tous les js compilés par webpack) avec proxy vers le port 3021 pour le reste, 
il faut donc lancer dans une autre console le serveur node avec `pnpm run start:dev` 
pour qu'il se lance sur le bon port.

Pour lancer deux Sésathèques (pour un usage avec un sesalab à coté), vous pouvez utiliser `pnpm run start:both` (qui va lancer les deux avec _private/config.js et _private/commun.js)
