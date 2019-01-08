# Plugins

## Installation
Dans le fichier `config.js` de la sesathèque, on a besoin de:

```
plugins: {
  // liste des plugins internes:
  internal: ['mental', 'serie', ...],
  // plugins externes au format des dépendances de package.json:
  external: {
    '@sesatheque-plugins/arbre': 'git+ssh://git@framagit.org/Sesamath/sesatheque-plugin-arbre.git#1.0.8',
    ...
  }
}
```
Lors de l'installation des paquets de la sesatheque, les plugins sont automatiquement installés et configurés.

## Architecture des plugins

### Structure
Chaque plugin a un type qui est une chaîne de caractères et qui lui est propre. Par exemple: 'j3p', 'arbre'.

Chaque plugin doit exposer:
* icon qui exporte un objet {type, icon}
* display qui exporte un objet {type, ...displayOThers}
* editor qui exporte un objet {type, ...editorOthers}

L'objet displayOthers peut contenir les propriétés optionnelles:
* display: void function(ressource, options, next) qui permet d'afficher la ressource en lecture

L'objet editorOthers peut contenir les propriétés optionnelles:
* editor: composant react permettant l'édition des paramètres de la ressource
* validate: void function(ressource) utilisé par redux-form
* defaultValue: objet des valeurs par défaut de la ressource
* loadHook: ressource function(ressource) transformation de la ressource au chargement dans le formulaire d'édition
* saveHook: ressource function(ressource) transformation de la ressource à la sauvegarde

Un fichier `webpack.config.js` doit être placé à la racine et doit contenir:
```
// version est la version de la sesatheque
module.exports = ({version}) => ({
  entries: {...},
  plugins: [...],
  rules: [...]
})
```
Il permet au plugin de compléter la configuration webpack de la sesathèque. Les fichiers concernés par un des objets de `rules` seront transformés par babel avec la configuration de la sesathèque.

### Interactions avec la sesathèque

La configuration webpack de la sesathèque expose les alias:
* client-react
* client
* server
* plugins

Par exemple, les plugins peuvent utiliser les composants génériques du client react:

`import {InputField} from 'client-react/components/fields'`

ou accéder aux icones des plugins:

`import icons from 'plugins/icons'`

Les plugins doivent utiliser les paquets installés par la sesathèque: 'react', 'prop-types', 'redux', 'redux-form', etc. sans les expliciter dans leur `package.json`.

## Limitations de l'architecture

Lors de l'installation des node_modules dans /app/plugins, il peut y avoir réinstallation d'un paquet déjà présent dans /node_modules et, lors du build webpack, il peut y avoir duplication de code. Ceci ne doit pas avoir de conséquence sur le fonctionnement mais peut occasionner une légère augmentation de la taille des fichiers.

Ce problème concerne surtout la lecture des ressources lorsqu'un module est importé dans `/client/display` et aussi dans le display d'un plugin (par ex: `sesajstools/http/xhr`).

En évitant toute duplication des node_modules, un test montre qu'on gagne 4% sur la taille de l'ensemble des fichiers construits par webpack (28848 Ko -> 27672Ko). En environnement de développement, on gagne 2,5% sur les fichiers chargés pour l'affichage d'une ressource de type qcm.

Les yarn workspaces résolvent naturellement ce problème mais nécessitent une réorganisation profonde de l'application (mais pas a priori de l'architecture des plugins).

## Développer un plugin

Pour le développement local, c'est pénible de devoir faire commit + push du plugin puis install dans la sésathèque simplement pour tester le code. Avec pnpm on peut faire du link en local :

```
# se mettre dans le dossier du plugin, par ex
cd sesatheque-plugin-mathgraph
# il faut avoir les droits d'écriture sur /usr/pnpm-global/node_modules
pnpm link

# se mettre dans le dossiers de la sésathèque
cd ../sesatheque
# si besoin màj des modules
pnpm i
# se placer dans le dossier des plugins
cd app/plugins
# linker le module précédent
pnpm link @sesatheque-plugins/mathgraph
# retour à la racine et rebuild
cd ../..
pnpm run build
# ou pnpm run build:watch
```

## Ce qu'il reste à faire

On trouve une partie de la configuration des plugins dans server/ressource/config.js:

* listes.type contient les noms d'affichage de chaque plugin
* editable contient des détails sur les permissions nécessaire pour créer une ressource d'un type particulier
* typePerso n'est pas utilisé actuellement
* typeIframe n'est pas utilisé actuellement
* typeToCategories n'est pas utilisé actuellement

Il faudrait que le nom d'affichage soit fourni par le plugin et que le reste de la configuration soit placée dans le fichier qui liste les plugins à installer.
