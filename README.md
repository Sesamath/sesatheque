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

Framework Lassi
---------------

Cf [lassi](lassi/index.html)

Plugins
-------

Pour écrire ou utiliser un plugin (qui gère un type de ressource), voir la [documentation des plugins](plugins/index.html)

Routage
-------

[/ressource/](controllerRessource.html) et [/public/](controllerPublic.html)


API http
--------

Doc [dédiée](restApi/) qui pour le moment est identique à [/api/](controllerApi.html)

Module pour normaliser les réponses de la sésathèque [sesatheque-client](modules/sesatheque-client/)

Module (AMD client) pour récupérer ou enregistrer des ressources sur la sésathèque [apiClient](modules/apiClient/)

API client
----------

Cf aussi la doc du [module sesatheque-client](modules/sesatheque-client/module-sesatheque-client.html)


Scripts
-------

Regarder le contenu du dossier script pour voir la liste des tâches automatisées
(lancer l'appli, la déployer, la tester, générer la doc, etc.)

Il y a aussi le dossier tasks avec les tâches d'import (à priori spécifique à l'instance sesatheque de Sésamath)

Documentation
-------------

On utilise jsdoc3 avec le template jaguar-jsdoc, et des tags supplémentaires `@service`, `@controller`, `@route`, `@plugin` définis dans jsdoc/plugins_sup/ngdoc.js

Le template jaguar-jsdoc ne rend pas les `@module`, c'est dommage (mais des tests avec ink-docstrap montraient d'autres inconvénients)
et pour se simplifier la vie on utilise `@service` dans ces cas là. 
Il faut utiliser `@memberOf leNomDuModuleDéclaréCommeService` sur chaque méthode exportée par le module pour la voir apparaître correctement dans la doc.
