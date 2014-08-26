Plugin ressource
================

Tous les plugins doivent exporter les méthodes display et showResult avec la syntaxe 
```
define(['moduleRequis1', 'moduleRequis2'], function(module1, module2) {
  // du code privé pour initialiser ce que l'on veut
  
  // la liste des méthodes que l'on exporte 
  return {
    // sera appelée avec les arguments (ressource, saveResult), saveResult pouvant être undefined ou une fct
    display : afficher
    // on peut aussi mettre le code directement ici
    showResult : function (args) { /* code */ },
  }
})

/**
 * Tout le reste est privé, spécifique à ce plugin sans collision possible avec le DOM de la page courante
 *
 * this est ce module (donc on a par exemple les méthodes this.display et this.showResult, mais pas this.document),
 * avec disponible dans notre scope les variables
 * {Function}    define          : à utiliser une fois pour définir les librairies que l'on veut avoir à disposition
 *                                 avant de renvoyer l'export de ce module
 * {Function}    require         : pour charger d'autres modules ou d'autres scripts js (dans notre dossier)
 * {Object}      window          : l'objet window
 * {Object}      post            : le post éventuel (sinon un objet vide)
 *
 * Dans l'objet window on a ajouté les propriétés suivantes
 * {Function}    log(msg)        : un console.log qui ne fait rien en prod, ne plantera pas sur les vieux IE
 *                                 et accepte un éventuel objet un 2e argument
 * {Function}    addCss(file)    : ajoute une css dans le head de la page courante
 *                                 (lui passer le fichier relativement au dossier du plugin)
 * {Function}    addElement(eltContainer, tag, attributes, innerText) : ajoute un HTMLElement dans eltContainer
 * {Function}    getElement(tag, attributes, innerText) : récupère un HTMLElement
 * {HTMLElement} container       : le conteneur pour l'affichage (div#display)
 * {HTMLElement} errorsContainer : un conteneur pour afficher d'éventuelles erreurs (div#errors au dessus du display)
 * {String}      baseUrl         : le préfixe vers ce dossier à utiliser dans d'éventuels href (sans le / de fin, 
 *                                 pour des médias ou autres fichiers à charger)
 */
 // une variable privée de ce module mais globale pour nos fonctions
 var toto;
 
 function foo(ressource, saveResult) { /* */ }
 
 funtion truc(args) {/* */}
 // etc.
 
```
