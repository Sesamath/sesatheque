Installation
============

Si vous avez des droits sur le dépôt (vous avez communiqué votre clé publique),
dans le dossier parent dans lequel vous voulez créer un dossier sesatheque
(pour lui donner un autre nom localement ajouter votre nom à la fin de la commande clone)

- récupérer le projet depuis Github
- installer les modules npm avec le classique `npm install`
- créer une base mysql et un user pouvant écrire dedans
- copier app/_private.example en app/_private
- modifier app/_private/config.js pour mettre à minima les accès mysql
  (mais vous pouvez surcharger n'importe quel paramètre de configuration de app/config.js)
- si vous utilisez pm2, modifier éventuellement app/_private/pm2App.json5 pour le chemin des logs pm2
-   lancer l'appli avec au choix
    - `node app/index.js`
    - `npm start` (lancera l'appli avec pm2 s'il est installé)
    - `./script/run` (ajouter -h pour voir les options)

Il est pratique d'ajouter dans votre $PATH les chemins `./node_modules/.bin` et `./scripts`, en ajoutant par ex
`PATH="$PATH:./node_modules/.bin:./scripts"` à votre ~/.bashrc


Installation rapide avec Docker, pour sesalab
============
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

- pour importer les bases MySQL il peut être utile d'exposer les containers MySQL sur le localhost en ajoutant un paramètre de ce type sur `mysql-private` et `mysql-global` dans docker-compose-for-sesalab.yml, ex:

```
mysql-global:
    image: mysql
    ports:
      - 12345:3306
```

- démarrer le docker sesatheque (et sesalab par ailleurs)

```
docker-compose -f docker-compose-for-sesalab.yml up
```
