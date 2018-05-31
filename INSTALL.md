Installation
============

Après avoir récupéré le [projet](https://github.com/Sesamath/sesatheque) depuis Github,
choisissez le cas correspondant à votre environnement :

Installation sans Docker
------------------------

- créer une base mongo (et un user pouvant écrire dedans si vous ne voulez pas laisser la base accessible en écriture à tout le monde)
- avoir un redis joignable
- copier app/_private.example en app/_private
- modifier app/_private/config.js pour mettre les accès mongo (si open bar la config de base doit suffire). Vous pouvez surcharger n'importe quel paramètre de configuration de app/config.js
- si vous utilisez pm2, modifier éventuellement app/_private/pm2App.json5 pour le chemin des logs pm2
- installer les dépendances (avec `npm install` ou `yarn install`)
-   lancer l'appli avec au choix
    - `node app/index.js`
    - `npm start` (lancera l'appli avec pm2 s'il est installé)
    - `./script/run` (ajouter -h pour voir les options)

Il est pratique d'ajouter dans votre $PATH les chemins `./node_modules/.bin` et `./scripts`, en ajoutant par ex
`PATH="$PATH:./node_modules/.bin:./scripts"` à votre ~/.bashrc


Installation avec Docker (sans sésalab)
---------------------------------------

- `mkdir _private; cp -R _private.example/config.docker.minimale.js _private/config.js`
- modifier le fichier de configuration pour les valeurs obligatoires, mails et clés (cookie et session)
- build docker `npm run docker:build`
- start avec `docker-compose up`
- une fois que la compil webpack est terminée se rendre à l'adresse http://localhost:3001

Installation avec Docker, avec sesalab
--------------------------------------

@todo créer un docker-compose.sesalab.yml avec un docker/sesalab/Dockerfile
(et rédiger la doc ci-dessous)
