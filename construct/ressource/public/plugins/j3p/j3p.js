/**
 * This file is part of Sesatheque.
 *   Copyright 2014-2015, Association Sésamath
 *
 * Sesatheque is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * Sesatheque is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Sesatheque (LICENCE.txt).
 * @see http://www.gnu.org/licenses/agpl.txt
 *
 *
 * Ce fichier fait partie de l'application Sésathèque, créée par l'association Sésamath.
 *
 * Sésathèque est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant
 * les termes de la GNU Affero General Public License version 3 telle que publiée par la
 * Free Software Foundation.
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

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
  var urlBaseJ3p = "http://j3p.sesamath.net";

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
      if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.g)
        throw new Error("Ressource incomplète");
      if (!opt.baseUrl || !opt.container || !opt.errorsContainer) throw new Error("Paramètres manquants");

      // le domaine où prendre les js j3p
      if (opt.isDev) {
        urlBaseJ3p = 'http://j3p.devsesamath.net';
      }

      // et on délègue tout le reste
      require([urlBaseJ3p + '/outils/loader.js'], function (loader) {
        // on cache le titre
        window.hideTitle();
        // on lui donne nos params
        loader.init({urlBaseJ3p:urlBaseJ3p, log:log});
        var j3pOptions = {};
        if (opt.saveResultat) {
          // j3p veut un nom de fct qui existe en global dans son dom
          window.saveResultat = opt.saveResultat;
          j3pOptions.nomFctScore = 'saveResultat';
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
