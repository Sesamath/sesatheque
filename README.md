Application Sésathèque
========================

<!--
Pour la syntaxe markdown de ce document cf http://daringfireball.net/projects/markdown/syntax
Pour générer la doc, lancer depuis la racine
  ./script/doc -a
(./script/doc pour afficher les options possibles)
-->

Installation
------------

Cf INSTALL.md à la racine du projet

Mise à jour
-----------

`npm run maj` va récupérer les dernières sources et reconstruire le js client. 

Framework Lassi
---------------

Cf [lassi](lassi/index.html)

Plugins
-------

Pour écrire ou utiliser un plugin (qui gère un type de ressource), voir la [documentation des plugins](plugins/index.html)

Routes
-------

Cf la doc des différents contrôleurs
* [/](controllerMain.html)
* [/auth/](controllerAuth.html)
* [/groupe/](controllerGroupe.html)
* [/public/](controllerPublic.html)
* [/ressource/](controllerRessource.html)
et ci-dessous pour la route /api/


API http
--------

Doc [dédiée](restApi/) qui pour le moment est identique à [/api/](controllerApi.html)

API client
----------

Cf la doc du [module sesatheque-client](modules/sesatheque-client/)

Module sesaJsTools
------------------

Qui peut être utilisé indépendamment d'une sésathèque, cf sa [doc](modules/sesajstools/)

Module sesalabSso
------------------

Peut être utilisé indépendamment d'une sésathèque, utilisé pour le moment pour propager une authentification 
sesalab=>sesathèque, cf sa [doc](modules/sesalab-sso/)

Scripts
-------

Regarder le contenu du dossier script pour voir la liste des tâches automatisées
(lancer l'appli, la déployer, la tester, générer la doc, etc.)

Il y a aussi le dossier tasks avec les tâches d'import (à priori spécifique à l'instance sesatheque de Sésamath)

Tests
-----

`npm run test:all` lance tous les tests localement, pour les lancer dans le conteneur docker il faut
créer un fichier `_private/.testOnDocker` (vide, son contenu est ignoré) et lancer les tests avec `npm test`

Documentation
-------------

On utilise jsdoc3 avec le template jaguar-jsdoc, et des tags supplémentaires `@service`, `@controller`, `@route`, `@plugin` définis dans jsdoc/plugins_sup/ngdoc.js

Le template jaguar-jsdoc ne rend pas les `@module`, c'est dommage (mais des tests avec ink-docstrap montraient d'autres inconvénients)
et pour se simplifier la vie on utilise `@service` dans ces cas là. 

Il faut utiliser `@memberOf leNomDuModuleDéclaréCommeService` sur chaque méthode exportée par le module 
pour la voir apparaître correctement dans la doc, pas trouvé de moyen de contournement.

Tutos
-----

{@tutorial editors}
