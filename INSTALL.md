Installation
============

Après avoir récupéré le [projet](https://github.com/Sesamath/sesalab) depuis Github,
choisissez le cas correspondant à votre environnement :

Installation sans Docker
------------------------

- créer une base mongo (et un user pouvant écrire dedans si vous ne voulez pas laisser la base accessible en écriture à tout le monde)
- avoir un redis joignable
- copier app/_private.example en app/_private
- modifier app/_private/config.js pour mettre les accès mongo (si open bar la config de base doit suffire). Vous pouvez surcharger n'importe quel paramètre de configuration de app/config.js
- si vous utilisez pm2, modifier éventuellement app/_private/pm2App.json5 pour le chemin des logs pm2
-   lancer l'appli avec au choix
    - `node app/index.js`
    - `npm start` (lancera l'appli avec pm2 s'il est installé)
    - `./script/run` (ajouter -h pour voir les options)

Il est pratique d'ajouter dans votre $PATH les chemins `./node_modules/.bin` et `./scripts`, en ajoutant par ex
`PATH="$PATH:./node_modules/.bin:./scripts"` à votre ~/.bashrc


Installation avec Docker (sans sésalab)
---------------------------------------

- installer les modules npm avec le classique `npm install`

- `cp -R _private/ _private`

- modifier le fichier de configuration afin d'être compatible avec votre environnement de développement :
    - spécifier l'email à utiliser
    - modifier l'accès à Redis et Mongo
  ```
    $entities: {
      database: {
        host: 'mongo',
        port: '27017',
        name: 'sesatheque'
      }
    },

    $cache: {
      redis: {
        host: 'redis',
        port: 6379,
        prefix: 'sesatheque'
      }
    },
  ```

- démarrer le container de la sesatheque
```
docker-compose up
```

- se rendre à l'adresse http://localhost:3001

Installation avec Docker, pour sesalab
--------------------------------------

- `mkdir app/logs`

- installer les modules npm avec le classique `npm install`

- `cp -R _private.exemple-docker-sesamath/ _private`

- editer `/etc/hosts` et ajouter les deux lignes

```
127.0.0.1       bibliotheque.local
127.0.0.1       commun.local
```

- récupérer votre adresse réseau en faisant `ifconfig`, en général de la forme `192.168.1.x` (cela permettra au container sesatheque de communiquer directement avec le container sesalab)

- dans *sesamath* `_private/config.js`
   - utiliser l'adresse réseau pour le baseUrl de l'application, ex: `baseUrl: 'http://192.168.1.187:3002'``
   - définir les bibliothèques locales :

```
    sesatheques : [
      {baseId: 'biblilocal3001', baseUrl: 'http://bibliotheque.local:3001/'},
      {baseId: 'communlocal3003', baseUrl: 'http://commun.local:3003/'}
    ],
```

- dans *sesatheque* `_private/commun.js` et  `_private/config.js`  définir la baseUrl de sesalab avec l'adresse réseau, ex: `baseUrl: 'http://192.168.1.187:3002/'``

- démarrer le docker sesatheque (et sesalab par ailleurs)

```
docker-compose -f docker-compose-for-sesalab.yml up
```
