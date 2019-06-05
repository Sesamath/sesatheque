Notes pour les développeurs
===========================

Dans toute la doc, on utilise pnpm (`npm -g i pnpm` pour l'installer globalement), mais vous pouvez utiliser npm ou yarn si vous préférez.

La motivation principale est la rapidité et le gain d'espace disque :
- https://pnpm.js.org/docs/en/motivation.html
- https://www.kochan.io/nodejs/why-should-we-use-pnpm.html

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

Développement d'un plugin
-------------------------

Ce qui suit est aussi valable pour d'autres dépendances (sesajstools & co).

Pour pouvoir développer une dépendance de sésathèque et avoir le résultat en live dans la sesathèque locale, il faut utiliser `pnpm link` (Attention, ça marche pas avec `npm link`, un très vieux bug de npm qui remonte à npm3)

On va prendre un exemple "défavorable" de dépendance de dépendance, avec sesaeditgraphe, utilisé par le plugin j3p

- On récupère localement les 3 dépôts git, celui de la sesathèque est déjà là, reste les 2 autres 
```
# depuis le dossier local sesatheque
cd ..
# (l'url est dans package.json, dans les peerDependencies, 
# mais ici on clone via ssh et pas http pour pouvoir faire des push ultérieurement)
git clone git@framagit.org:Sesamath/sesatheque-plugin-j3p.git
# idem pour sesaeditgraphe (cf sesatheque-plugin-j3p/package.json) 
git clone git@framagit.org:Sesamath/sesaeditgraphe.git

# on link sesaeditgraphe dans le plugin j3p
cd sesaeditgraphe
pnpm i
# On link ce module (register dans la "base" globale pnpm)
pnpm link
# On va dans le plugin j3p pour utiliser ce dossier local
cd ../sesatheque-plugin-j3p
pnpm install
pnpm link sesaeditgraphe

# et idem pour le plugin j3p dans la sesatheque
pnpm link
# On retourne dans la sesatheque pour l'utiliser
cd ../sesatheque/app/plugins
pnpm link @sesatheque-plugins/j3p

# désormais, on peut développer localement dans le dossier editgraphe et voir le résultat en live dans la sesatheque
# on lance en mode dev + watch (des js client)
cd ../..
# on lance le serveur en mode dev (décale le port)
pnpm run start:dev
# et dans une autre console webpack-dev-server
pnpm run start:devFront

# on peut aller dans le dossier sesaeditgraphe pour y faire des modifs et les voir en live dans le navigateur
```

Pour revenir à une situation "normale" avec des dépendances installées par pnpm (et plus les links vers nos dossiers locaux)
```
# depuis le dossier de la sésathèque
cd app/plugins
pnpm unlink @sesatheque-plugins/j3p

# depuis le dossier sesatheque-plugin-j3p
pnpm unlink sesaeditgraphe

# (on pourrait lancer un `pnpm unlink` pour supprimer le module des modules pouvant être linkés
# mais c'est pas forcément utile, si on veut pouvoir refaire le link plus tard sans avoir à 
# refaire ce "register")
```
