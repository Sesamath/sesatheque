/**
 * Ressource calculatice en flash
 * ex 5894 et suivants
 */
/*global define, log, container, window */
//'use strict';

var baseEc2 = "http://www.labomep.net/exercices_calculatice";

/** module de chargement d'un swf */
var sesaswf

define(['sesaswf'], function (module) {
  // on affecte notre var sesaswf avec le module chargé
  sesaswf = module
  // charger_options et enregistrer_score exportées dans le dom global par display

  return {
    display   : display,
    showResult: showResult
  }
});

// reste à définir nos méthodes

/**
 * Affiche la ressource dans l'élément d'id mepRess
 * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
 * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
 *                              et éventuellement resultCallback)
 * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
 */
function display(ressource, options, next) {
  var swfUrl;

  log('start ec2 display avec la ressource', ressource)
  //les params minimaux
  if (!ressource.id || !ressource.titre || !ressource.parametres || !ressource.parametres.swf) {
    throw new Error("Paramètres manquants");
  }
  // le swf
  swfUrl = baseEc2 +'/' +ressource.parametres.swf;
  // les fcts exportées pour le swf
  var optionsChargement = ressource.parametres.json || "defaut";
  window.charger_options = function () {return optionsChargement;};

  window.enregistrer_score = function (datasCalculatice) {
    if (options && options.resultCallback) {
      log("résultats reçus", datasCalculatice);
      options.resultCallback({reponse:datasCalculatice});
    }
  };

  // On réinitialise le conteneur
  container.innerHTML = '';

  // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
  container.setAttribute("width", 735); // change rien avec ff
  container.style.width = '735px';

  options = {
    largeur : 735,
    hauteur : 450,
    base : baseEc2,
    flashvars : {
      contexte: 'LaboMEP', // encore utile ça ?
      statut: 'eleve'
    }
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
