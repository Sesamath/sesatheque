Plugin ressource
================

Pour la doc du code serveur, cf [sesatheque](../index.html)

Cf [global](./global.html) pour la liste des méthodes globales accessibles depuis un plugin.

Tous les plugins doivent exporter une méthode display  

```javascript
define(['moduleRequis1', 'moduleRequis2'], function(module1, module2) {
  // du code privé pour initialiser ce que l'on veut
  
  // la liste des méthodes que l'on exporte 
  return {
    display : function (ressource, options) {…},
    …
  }
})

// Tout le reste est privé, spécifique à ce plugin sans collision possible avec le DOM de la page courante
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
Il faut alors passer `options.sesathequeBase = "http://sesathequeDomain/"`, en général à display() mais ça peut être à init() 
(si on veut appeler des méthodes de plugins sans passer par display), que le require.js soit celui du domaine appelant ou celui de la sésathèque.

Cette

Cf {@link initOptions} et {@link displayOptions}

Par exemple, si on a déjà la ressource complète

```html
<!-- sur foo.domain -->
<script type="text/javascript" src="path2/require.js"></script>

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
    typeTechnique = "…",
    etc.
  }
  
  // exemple pour configurer le require de la sesatheque et y charger des modules
  // ici le module standard display qui chargera le bon plugin, mais on peut charger directement le plugin
  // si besoin
  require(['http://sesatheque.domain/display.js'], function(display) {
    // les options à passer
    var options = {
      sesathequeBase = "http://sesathequeDomain/",
      container : document.getElementById("laRessource"),
      resultatCallback : saveResultat
    };
    
    // et on affiche
    display(ressource, options);
  })
</script>
```

Autre exemple où on appelle d'abord la sesathèque pour charger une ressource (avec son apiClient.js)

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
      sesathequeBase = "http://sesathequeDomain/",
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
