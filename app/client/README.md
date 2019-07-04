Code js client
==============

Pour la doc du code serveur, cf [sesatheque](../index.html)

Chargement en cross-domain
--------------------------

Pour charger des ressources, une iframe suffit, même pour récupérer des résultats via une api http sur https://monDomain/pathQcq?arg=value
(il faut préciser la taille de l'iframe en css, cf cet exemple [css](https://stackoverflow.com/a/27853830) ou en [js](https://stackoverflow.com/a/330006),
on peut aussi utiliser la propiété [calc](https://developer.mozilla.org/en-US/docs/Web/CSS/calc) de css qui passe à partir d'IE9)

```html
<iframe src="https://sesathequeDomain/public/voir/XX?urlResultatCallback=https://monDomain/pathQcq%3Farg%3Dvalue" />
```

Si on veut que la sésatheque ajoute des infos au résultat, par ex le nom qu'on lui a donné (si on en appelle plusieurs)

```html
<iframe src="https://sesathequeDomain/public/voir/XX?urlResultatCallback=https://monDomain/pathQcq%3Farg%3Dvalue&sesatheque=leNomQueJeLuiDonne&userOrigine=moi&userId=sonIdChezMoi" />
```

On peut aussi utiliser les modules js de la sésathèque en cross-domain, pour mettre les ressources dans son dom et interagir dessus.

Il faut alors passer `options.base = "https://sesathequeDomain/"` à `window.stdisplay(ressource, options)` (si on a
chargé display.js)

Si l'on veut récupérer une ressource, il faut charger client.js puis
```
// le nom bibli est arbitraire, ici la syntaxe permettant d'avoir plusieurs sesatheques sur le même client
var client = window.stclient({bibli:'https://bibliotheque.sesamath.net'})
client.getRessource('bibli', 42, "alias", callbackFct)
```

Cf {@link initOptions} et {@link displayOptions}

Par exemple, si on a déjà la ressource complète

```html
<!-- sur foo.domain -->
<script type="text/javascript" src="https://sesathequeDomain/display.$baseId.js"></script>

<!-- code quelconque -->

<div id="laRessource"></div>

<!-- code quelconque -->

<script type="text/javascript">
  // si l'on veut récupérer les résultats, faut une fonction pour ça
  function saveResultat(resultat) {
    // on a reçu un résultat que l'on va enregistrer ici
    console.log(resultat);
  }

  // on veut afficher cette ressource
  var ressource = {
    titre: "…",
    type: "…",
    etc.
  }

  // les options à passer
  var options = {
    base: "https://sesathequeDomain/",
    container: document.getElementById("laRessource"),
    resultatCallback : saveResultat
  };
  // le module standard display charge le bon plugin et initialise toutes les valeurs par défaut
  stdisplay(ressource, options);
</script>
```

Pour d'autres usages, cf la doc du [module sesatheque-client](../modules/sesatheque-client/module-sesatheque-client.html)
(par ex pour récupérer une ressource d'abord, lui modifier ses propriétés puis l'afficher)


Plugins de ressources
=====================

Cf [global](./global.html) pour la liste des méthodes globales accessibles depuis un plugin.

Tous les plugins doivent exporter un module display (display.js dans le dossier du module) et un module edit (edit.js)

```javascript
// Tout le code est privé, spécifique à ce plugin sans collision possible avec le DOM de la page courante
// que ce soit dans la fonction exportée ou en dehors (en général on déclare les modules en dépendance en premier
// mais ils pourraient être dans la fonction)
var log = require('../../tools/log')
function display(ressource, options) {
  // le code
}
module.exports = display
```

Pour passer une fonction de sauvegarde à une ressource chargée en iframe, il faut appeler l'url avec un paramètre
* resultCallbackUrl : url qui sera appelée en ajax (post) avec un objet Résultat.
Cette url devra répondre
{"ok":true} ou {"success":true} ou bien {"ok":false, "error":"Un message d'erreur"}

Attention à passer l'url de rappel à travers encodeURIComponent si elle contient des "&"

* resultatMessageAction : nom de l'action à passer dans l'objet qui sera envoyé en sendMessage. Si cette action contient `::`, la deuxième partie est le nom de la propriété qui contient le résultat.

Ex, avec resultatMessageAction=saveResultat, la ressource en iframe fera un sendMessage avec l'objet
```
{ nom
```

Le résultat est au format du constructeur {@link Resultat}

Pour que la ressource puisse charger son dernier résultat, il faut lui passer un
lastResultUrl, url que la ressource appelera en ajax pour récupérer le dernier résultat si elle le gère.

Développement local
-------------------

Pour le développement en local, c'est nettement plus simple de pouvoir modifier un plugin et avoir le résultat en direct dans son navigateur. Pour y parvenir :
- dans le dépôt git local du plugin (sesatheque-plugin-xxx) `pnpm link`
- dans app/plugins `pnpm link @sesatheque-plugins/xxx` 
- On démarre le serveur avec `pnpm run start:dev` (ça décale le port d'écoute de 3001 vers 3021)
- On démarre webpack-dev-server avec `pnpm run start:devFront` (ça écoute sur le 3001 et proxy vers 3021 tout ce qui ne sort pas de webpack)
- On peut alors modifier les js de sesatheque-plugin-xxx et avoir le résultat en live dans http://bibliotheque.local:3001/… (sans avoir besoin de recharger la page à chaque fois qu'un js change, c'est webpack-dev-server qui injecte le nouveau code en live dans la page courante)

Pour revenir à l'état "normal"
- dans app/plugins `pnpm unlink @sesatheque-plugins/xxx` 
- (à priori pas utile, ce sera prêt pour la prochaine fois) dans le dépôt git local du plugin (sesatheque-plugin-xxx) `pnpm unlink`

Attention, pour le plugin arbre ça marche pas (pb avec jstree, probablement un bug babel/webpack qq part), il faut éditer les fichiers dans app/plugins/@sesatheque-plugins/arbre puis synchroniser les fichiers avec le dépôt du plugin quand c'est satisfaisant.
