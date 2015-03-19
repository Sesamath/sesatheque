Application Bibliothèque
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

*  POST   /api/ressource     Enregistre une nouvelle ressource ou la met à jour
*  DELETE /api/ressource/:id Efface une ressource
*  DELETE /api/ressource/:origine/:id
*  POST   /api/ressourceMerge Pour les envois partiels (genre le titre qui change)

### Les listes

* POST   /api/public/by     Pour récupérer une liste de ressources publiques (poster en json les params, cf le jsdoc du code)
* POST   /api/prof/by       Pour récupérer une liste de ressources réservées aux prof
* POST   /api/my/by         Pour récupérer les ressources de l'utilisateur

Il faut envoyer un objet avec les propriétés (toutes facultatives)

*  filters : un tableau d'objets {index:'indexAFiltrer', values:valeur},
            où valeur peut être undefined ou un tableau de valeurs
            (si non précisé filtrera sur les ressources ayant cet index)
*  orderBy : L'index sur lequel trier
*  order   : asc ou desc
*  start   : L'indice de la 1re valeur à remonter
*  nb      : Le nombre de ressources à remonter
*  full    : Préciser true si on veut aussi la propriété parametres des ressources
            (sinon on renvoie tout sauf elle)
            
### Les arbres

* POST   /api/arbre         Permet d'enregistrer une ressource en passant un json au format [Arbre](Arbre.html)
* GET    /api/arbre/:id     Récupère la ressource :id au format Arbre

