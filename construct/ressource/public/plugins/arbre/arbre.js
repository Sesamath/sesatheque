/**
 * @file Affiche un arbre
 */

/* global define, module*/
define(['jquery211', 'jqueryUi1111DialogRedmond'], function () {

  return {
    display   : display,
    showResult: function () {} // un arbre ne renvoie pas de résultat…
  }
});

/**
 * Affiche l'arbre
 * @param {Object}   ressource  L'arbre dans son format "ressource"
 * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
 *                              et éventuellement resultCallback)
 * @param {Function} next       La fct à appeler quand la ressource sera chargée (sans argument ou avec une erreur)
 */
function display(ressource, options, next) {
 // @todo à implémenter de la même manière que dans labomep
}
