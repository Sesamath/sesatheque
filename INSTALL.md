Installation
============

Si vous avez des droits sur le dépôt (vous avez communiqué votre clé publique), 
dans le dossier parent dans lequel vous voulez créer un dossier sesatheque 
(pour lui donner un autre nom localement ajouter votre nom à la fin de la commande clone)

```bash
git clone git@src.sesamath.net:sesatheque
```

sinon

```bash
# dans le dossier parent dans lequel vous voulez créer un dossier sesatheque
git clone git://src.sesamath.net/sesatheque
```

Ensuite

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

Memo
====

Pour configurer standard avec webstorm https://github.com/feross/standard/blob/master/docs/webstorm.md
