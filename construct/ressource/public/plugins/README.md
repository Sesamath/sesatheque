Plugin ressource
================

Tous les plugins doivent exporter les méthodes display et showResult avec la syntaxe 
```
define(['moduleRequis1', 'moduleRequis2'], function(module1, module2) {
  // du code privé pour initialiser ce que l'on veut
  
  // la liste des méthodes que l'on exporte 
  return {
    /**
     * display sera appelée avec les arguments (ressource, options), options contient les propriétés 
     *   {string}      baseUrl         Le préfixe d'url qui pointe vers le dossier du plugin
     *   {HTMLElement} container       Le div pour afficher la ressource
     *   {HTMLElement} errorsContainer Le div pour afficher les erreurs
     * et peut contenir
     *   {boolean}     isDev           true si on est en dev
     *   {function}    saveResult      La fct à qui on doit passer un résultat
     *                                 (Cf le constructeur Resultat pour le format)
     */
    display : foo,
    // on peut aussi mettre le code directement ici
    showResult : function (args) { /* code */ },
  }
})

/**
 * Tout le reste est privé, spécifique à ce plugin sans collision possible avec le DOM de la page courante
 *
 * this est ce module (donc on a par exemple les méthodes this.display et this.showResult, mais pas this.document),
 * avec disponible dans notre scope l'objet window qui contient (faut prefixer par window pour y accéder)
 * {Function}    define          : à utiliser une fois pour définir les librairies que l'on veut avoir à disposition
 *                                 avant de renvoyer l'export de ce module
 * {Function}    require         : pour charger d'autres modules ou d'autres scripts js (dans notre dossier)
 * {Object}      post            : le post éventuel (sinon un objet vide)
 *
 * Dans l'objet window on a ajouté les propriétés suivantes
 * {Function}    log(msg)        : un console.log qui ne fait rien en prod, ne plantera pas sur les vieux IE
 *                                 et accepte un éventuel objet un 2e argument (que l'on enverra aussi à console.log())
 * {Function}    addCss(file)    : ajoute une css dans le head de la page courante
 *                                 (lui passer le fichier relativement au dossier du plugin)
 * {Function}    addElement(eltContainer, tag, attributes, innerText) : ajoute un HTMLElement dans eltContainer
 * {Function}    getElement(tag, attributes, innerText)               : renvoie un HTMLElement créé d'après les arguments
 * {Function}    setError(errorMsg) : Affiche une erreur dans errorsContainer (ça efface la précédente s'il y en avait une)
 */
 // une variable privée de ce module mais globale pour nos fonctions
 var toto;
 
 function foo(ressource, options, next) { /* */ }
 
 funtion truc(args) {/* */}
 // etc.
 
```

Pour passer une fonction de sauvegarde à une ressource chargée en iframe, il faut appeler l'url avec un paramètre 
resultCallbackUrl qui sera appelée en ajax (post) avec un objet Résultat.
Cette url devra répondre
{"result":"ok"} ou bien {"error":"Un message d'erreur"}

Par exemple avec
```
<iframe src="http://laBibliothequeVoulue/ressource/voir/42?resultCallbackUrl=http://localhost:3000/debugJson/postOk" />
```
Attention à passer l'url de rappel à encodeURIComponent si elle contient des "&"

Le résultat est au format du constructeur Resultat (dans construct/ressource/public/vendors/sesamath/Resultat.js), 
mais avec seulement certaines propriétés complétées (à priori avec ressId, ressType, score, reponse, date, duree, 
mais parfois seulement ressType et score|reponse, tout le reste pouvant être déjà connu de l'appelant).