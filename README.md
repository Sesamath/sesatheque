Application Sésathèque
========================

<!--
Pour la syntaxe markdown de ce document cf http://daringfireball.net/projects/markdown/syntax
Pour générer la doc, lancer depuis la racine
    jsdoc -c jsdoc/jsdocApp.json
    jsdoc -c jsdoc/jsdocPlugins.json
-->

Framework Lassi
---------------

Cf [lassi](../node_modules/lassi/documentation/index.html)

Plugins
-------

Pour écrire ou utiliser un plugin (qui gère un type de ressource), voir la [documentation des plugins](plugins/index.html)

Routage
-------

### /ressource/ Affichage et modification de ressource

* /ressource/public/:id : affichage de la ressource publique seule (prévu pour être en iframe), cookies virés par varnish et résultat mis en cache
* /ressource/prive/:id  : affichage de la ressource seule (prévu pour être en iframe), redirect vers public si public
* /ressource/apercu/:id : affichage de la ressource avec l'habillage du site de consultation

Back-office
* /ressource/ajouter      : form d'ajout d'une ressource
* /ressource/modifier/:id : form de modif d'une ressource


API http, via /api
------------------

Les commandes qui nécessitent des droits les vérifient via l'ip (qui doit être locale ou celle d'un serveur connu)

### Ressource à l'unité

* GET    /api/ressource/:id          Récupère une ressource par son id
* GET    /api/ressource/:origine/:id Récupère une ressource par origine & idOrigine
* GET    /api/public/:id             Idem, mais ne remonte que les ressources publique, en cache dans varnish (car cookie virés, donc sans session, à faire).

À privilégier pour les appel de ressources qui sont dans les arbres public (de gauche).

*  POST   /api/ressource     Enregistre une nouvelle ressource ou la met à jour (retourne success, oid ou error, voire une Ref si on demande format:ref dans le post)
*  DELETE /api/ressource/:id Efface une ressource
*  DELETE /api/ressource/:origine/:id
*  POST   /api/ressourceMerge Pour les envois partiels (genre le titre qui change)

### Les listes

* GET|POST /api/liste/public     Pour récupérer une liste de ressources publiques
* GET|POST /api/liste/prof       Pour récupérer une liste de ressources incluant les corrigés (donc réservées aux profs du SSO Sésamath)
* GET|POST /api/liste/perso      Pour récupérer les ressources de l'utilisateur (en GET ajouter &connexion évitera une redirection interne éventuelle pour l'ajouter si on est pas connecté)

Les arguments du GET ou du POST peuvent contenir
* filters : array d'objets {index:nomIndex, values:tableauValeurs}, values peut être omis et ça remontera toutes les ressources ayant cet index
* orderBy : un nom d'index
* order   : préciser 'desc' si on veut l'ordre descendant
* start   : offset
* nb      : nb de résultats voulus (par défaut settings.ressource.limites.listeNbDefault, à priori 25), sera ramené à settings.ressource.limites.maxSql (à priori 500) si supérieur
* format  : ref|compact|full|default, par défaut on remonte chaque ressource avec toutes ses propriétés sauf paramètres 
(préciser full si on les veut, cf $ressourceConverter.(toRef|toCompact) pour les formats ref et compact, ou regarder par ex le résultat de GET /api/liste/public/by?filters=[{%22index%22:%22typeTechnique%22,%22values%22:[%22am%22]}]&format=compact
            
En GET, on peut préciser tous les arguments dans une seule chaine json avec ?json=…

Il y a toujours un merge avec le POST, qui prend donc l'ascendant si le même paramètre est précisé en GET et en POST

### Les arbres

* POST   /api/arbre         Permet d'enregistrer une ressource en passant un json au format [Arbre](Arbre.html)
* GET    /api/arbre/:id     Récupère la ressource :id au format Arbre

### Scripts

Regarder le contenu du dossier script pour voir la liste des tâches automatisées
(lancer l'appli, la déployer, la tester, générer la doc, etc.)

Il y a aussi le dossier tasks avec les tâches d'import (à priori spécifique à l'instance sesatheque de Sésamath)