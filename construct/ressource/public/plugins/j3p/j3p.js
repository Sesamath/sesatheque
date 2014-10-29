/**
 * Affiche une ressource de type j3p
 *
 * Cf ../README.md pour plus d'info sur l'écriture de plugins
 */

/*global define, log, addCss, window */
'use strict';


//define(['jquery171', 'jqueryUi18c'], function () {
// faudra ajouter le css au début de display
define(['head'], function () {
  /*global head*/
  var w = window;
  var baseUrl;
  var urlBaseJ3p = "http://j3p.sesamath.net";
  var container;
  var errorsContainer;
  var resultCallback;
  var ressId;
  var startDate;
  var isBasic;

  /**
   * Nos méthodes exportées
   */
  return {
    /**
     * Affiche la ressource dans l'élément d'id mepRess
     * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
     * @param {Object}   opt        Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
     *                              et éventuellement resultCallback)
     * @param {Function} next       La fct à appeler quand la ressource sera chargée (sans argument ou avec une erreur)
     */
    display   : function (ressource, opt, next) {
      log('j3p.display avec ressource et options', ressource, opt);
      //les params minimaux
      if (!ressource.id || !ressource.titre || !ressource.parametres || !ressource.parametres.g)
        throw new Error("Ressource incomplète");
      if (!opt.baseUrl || !opt.container || !opt.errorsContainer) throw new Error("Paramètres manquants");

      // le domaine où prendre les js j3p
      if (opt.isDev) {
        urlBaseJ3p = 'http://j3p.devsesamath.net';
        urlBaseJ3p = 'http://j3p.local';
      }

      // et on délègue tout le reste
      require([urlBaseJ3p + '/outils/loader.js'], function (loader) {
        // on lui donne nos params
        loader.init({urlBaseJ3p:urlBaseJ3p, log:log});
        var j3pOptions = {};
        if (opt.resultCallback) {
          // j3p veut un nom de fct qui existe en global dans son dom
          window.resultCallback = resultCallback;
          j3pOptions.nomFctScore = 'resultCallback';
        }
        loader.charge(opt.container, ressource.parametres.g, j3pOptions);
      });
    }, // display

    /**
     * Affiche un résultat sauvegardé préalablement
     * @param {Object}      result Le résultat tel qu'il a été passé à resultCallback au préalable
     * @param {HTMLElement} elt    L'élément html (https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
     */
    showResult: function (result, elt) {
      log('showResult', result)
      log("dans l'élément", elt)
    }
  }
});
