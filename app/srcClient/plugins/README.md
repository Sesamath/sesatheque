Plugins de ressources
=====================

Pour la doc du code serveur, cf [sesatheque](../index.html)

Cf [global](./global.html) pour la liste des méthodes globales accessibles depuis un plugin.

Tous les plugins doivent exporter un module display (display.js dans le dossier du module) et un module edit (edit.js) 

```javascript
// Tout le code est privé, spécifique à ce plugin sans collision possible avec le DOM de la page courante
// que ce soit dans la fonction exportée ou en dehors (en général on déclare les modules en dépendance en premier 
// mais ils pourraient être dans la fonction)
var log = require('../../tools/log')
function display(ressource, options) {
  // le code
})
module.exports = display
```

Pour passer une fonction de sauvegarde à une ressource chargée en iframe, il faut appeler l'url avec un paramètre 
resultCallbackUrl qui sera appelée en ajax (post) avec un objet Résultat.
Cette url devra répondre
{"ok":true} ou {"success":true} ou bien {"ok":false, "error":"Un message d'erreur"}

Attention à passer l'url de rappel à encodeURIComponent si elle contient des "&"

Le résultat est au format du constructeur {@link Resultat}

Chargement en cross-domain
--------------------------

Pour charger des ressources, une iframe suffit, même pour récupérer des résultats via une api http sur http://monDomain/pathQcq?arg=value
(il faut préciser la taille de l'iframe en css, cf cet exemple [css](http://stackoverflow.com/a/27853830) ou en [js](http://stackoverflow.com/a/330006), 
on peut aussi utiliser la propiété [calc](https://developer.mozilla.org/en-US/docs/Web/CSS/calc) de css qui passe à partir d'IE9)

```html
<iframe src="http://sesathequeDomain/public/voir/XX?urlResultatCallback=http://monDomain/pathQcq%3Farg%3Dvalue" />
```

Si on veut que la sésatheque ajoute des infos au résultat, par ex le nom qu'on lui a donné (si on en appelle plusieurs)

```html
<iframe src="http://sesathequeDomain/public/voir/XX?urlResultatCallback=http://monDomain/pathQcq%3Farg%3Dvalue&sesatheque=leNomQueJeLuiDonne&userOrigine=moi&userId=sonIdChezMoi" />
```

On peut aussi utiliser les modules js de la sésathèque en cross-domain, pour mettre les ressources dans son dom et interagir dessus.

Il faut alors passer `options.base = "http://sesathequeDomain/"` à `display(ressource, options)` (si on a chargé display.bundle.js)
ou bien (si apiClient.bundle.js a été chargé)
```
var apiClient = require ('apiClient')
var client = apiClient('http://bibliotheque.sesamath.net')
client.getRessource(42, "alias", callbackFct)
// ou plus compact
var client = require ('apiClient')('http://bibliotheque.sesamath.net')
client.getRessource(42, "alias", callbackFct)
```

Cf {@link initOptions} et {@link displayOptions}

Par exemple, si on a déjà la ressource complète

```html
<!-- sur foo.domain -->
<script type="text/javascript" src="http://sesatheque.domain/display.bundle.js"></script>

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
    titre = "…",
    type = "…",
    etc.
  }
  
  // ici le module standard display chargera le bon plugin, il vaut mieux passer par lui 
  // car il initialise toutes les valeurs par défaut
  // (on pourrait charger directement le module plugins/xxx/display, mais c'est plus compliqué à gérer)
  var display = require('display')
  // les options à passer
  var options = {
    base = "http://sesathequeDomain/",
    container : document.getElementById("laRessource"),
    resultatCallback : saveResultat
  };
    
  // et on affiche
  display(ressource, options);
</script>
```

Autre exemple où on appelle d'abord la sesathèque pour charger une ressource (avec son apiClient.js)

OBSOLETE, à rectifier quand on aura des bundles qui vont bien

```html
<!-- sur foo.domain -->
<script type="text/javascript" src="path2/require.js"></script>

<!-- code quelconque -->
<div id="errors"></div>
<div id="laRessource"></div>

<!-- code quelconque -->

<script type="text/javascript">
  // si l'on veut récupérer les résultats, faut une fonction pour ça
  function saveResultat(resultat) {
    // on a reçu un résultat que l'on va enregistrer ici
    console.log(resultat);
  }
  
  // on veut afficher cette ressource
  var id = 42;
  // ou celle là
  id = "sesaxml/exercices_interactifs";
  
  // exemple pour configurer le require de la sesatheque et y charger ensuite des modules
  require(['http://sesatheque.domain/init.js'], function(init) {
    // on lui précise container et errorsContainer sinon il les créé
    // pour faire seulement l'init de requireJs avec le chemin sans charger les méthodes globales ni ajouter
    // ces containers, appeler seulement initRequire (seul bémol, jQueryUi a besoin de requireGlobal pour charger ses css, 
    // faut appeler avant requireGlobal dans ce cas) 
    var options = {
      base = "http://sesathequeDomain/",
      container : document.getElementById("laRessource"),
      errorsContainer : document.getElementById("errors")
    };
    init(options, function (error) {
      if (error) {
        // on la traite
      } else {
        // on peut appeler d'autres modules par leur nom
        require(['apiClient', 'display'], function (apiClient, display) {
          // chargement des datas de la ressource
          apiClient.getRessource(id, function (error, ressource) {
            if (error) …
            else if (ressource) {
              // les options à passer, plus la peine de préciser la base
              var options = {
                container : document.getElementById("laRessource"),
                errorsContainer : document.getElementById("errors"),
                resultatCallback : saveResultat
              };
              // et on affiche
              display(ressource, options);
            }
          });
        })
      }
    });
  })
</script>
```
