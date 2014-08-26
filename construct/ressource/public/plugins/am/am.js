/**
 * Tous les plugins doivent exporter les méthodes display et showResult
 */

/**
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
/*global define, log, container */
//'use strict';


/** notre module sesaswf */
var sesaswf

define(['sesaswf'], function (modswf) {
  // on affecte notre module
  sesaswf = modswf

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
  var baseSwf, swfUrl, options;
  var params = ressource.parametres;

  log('start am display avec la ressource', ressource)
  //les params minimaux
  if (!ressource.id || !ressource.titre || !params) {
    throw new Error("Paramètres manquants");
  }

  // On réinitialise le conteneur
  container.innerHTML = '';

  // notre base
  if (ressource.origine !== 'am' && ressource.baseUrl) baseSwf =  ressource.baseUrl;
  else baseSwf = "http://mep-col.sesamath.net/dev/aides/" +(params.mep_langue_id ? params.mep_langue_id : 'fr');
  // url du swf
  swfUrl = baseSwf +'/aide' +ressource.idOrigine +".swf";
  // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
  container.setAttribute("width", 735);
  options = {
    base    : baseSwf + "/",
    largeur : 735,
    hauteur : 450
  }
  sesaswf.load(container, swfUrl, options, next);
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
