/**
 * Tous les plugins doivent exporter les méthodes display et showResult
 *
 * Tout ce qui est dans ce fichier est privé,
 * spécifique à ce plugin sans collision possible avec le DOM de la page courante
 *
 * this est ce module (donc on a this.display et this.showResult), avec dans notre scope les variables
 * {Function}    require         : pour charger d'autres modules ou d'autres scripts js
 * {Function}    log             : un console.log qui ne plantera pas sur les vieux IE
 *                                 et accepte un éventuel objet un 2e argument
 * {Function}    addCss          : ajoute une css dans le head de la page
 *                                 (lui passer le fichier relativement à ce dossier)
 * {HTMLElement} container       : le conteneur pour affichage
 * {HTMLElement} errorsContainer : un conteneur pour afficher d'éventuelles erreurs
 * {String}      baseUrl         : le préfixe vers ce dossier à utiliser dans d'éventuels href
 *                                 (pour des médias ou autres fichiers à charger)
 * {Object}      window          : l'objet window
 *
 * et aussi
 * {Function} define  : utilisé ci-dessus pour définir les méthodes de ce module, ne doit pas être appelé une 2e fois
 */
/*global define, log, addCss, container, baseUrl, window */
//'use strict';

define(function () {
  return {
    display   : display,
    showResult: showResult
  }
});

// reste à définir nos méthodes

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource   L'objet ressource tel qu'il sort de la bdd
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
function display(ressource, next) {
  log('start url display avec la ressource', ressource)
  //les params minimaux
  if (!ressource.id || !ressource.titre || !ressource.parametres || !ressource.parametres.url) {
    throw new Error("Paramètres manquants");
  }
  var wd = window.document;
  var htmlElt;
  // init
  container.innerHTML = '';
  addCss(baseUrl + '/url.css');
  container.setAttribute("width", '100%');
  // msg d'attente du reste
  htmlElt = wd.createElement("p");
  htmlElt.appendChild(wd.createTextNode("En cours de développement, " +
      "pas encore de gestion de la consigne et des réponses"));
  container.appendChild(htmlElt);
  // url source
  htmlElt = wd.createElement("p");
  htmlElt.class = 'src';
  htmlElt.appendChild(wd.createTextNode("url source : " +ressource.parametres.url));
  container.appendChild(htmlElt);
  // la page
  htmlElt = wd.createElement("iframe");
  htmlElt.id = 'page';
  htmlElt.src = ressource.parametres.url;
  htmlElt.appendChild(wd.createTextNode("ce texte doit disparaître quasi instantanément, " +
      "sinon votre navigateur ne supporte probablement pas les iframes"));
  container.appendChild(htmlElt);
}

/**
 * Affiche un résultat sauvegardé préalablement
 * @param {Object}      result Le résultat tel qu'il a été passé à saveResult au préalable
 * @param {HTMLElement} elt    L'élément html (https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
 */
function showResult(result, elt) {
  log('showResult', result)
  log("dans l'élément", elt)
}
