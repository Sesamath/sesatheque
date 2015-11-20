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

try {
  define(function () {
    'use strict';
    /**
     * module pour afficher les ressources iep (iepme de manuel ou cahier)
     * @plugin iep
     */
    var iep = {};

    // raccourcis, si ça plante le catch gère
    var S = window.sesamath;

    // Le moment où ce module a été chargé dans le navigateur
    var startDate = new Date();

    /**
     * Affiche une ressource iep
     * @memberOf iep
     * @param {Ressource}      ressource  L'objet ressource
     * @param {displayOptions} options    Les options après init
     * @param {errorCallback}  next       La fct à appeler quand l'iep sera chargé (sans argument ou avec une erreur)
     */
    iep.display = function (ressource, options, next) {
      var container = options.container;
      if (!container) throw new Error("Il faut passer dans les options un conteneur html pour afficher cette ressource");

      // on enverra un résultat seulement à la fermeture
      if (options.resultatCallback && container.addEventListener) {
        container.addEventListener('unload', function () {
          options.resultatCallback({
            ressType: 'iep',
            ressOid: ressource.oid,
            date: startDate,
            duree: Math.floor((startDate.getTime() - (new Date()).getTime()) / 1000),
            score: 1
          });
        });
      }

      S.log('start iep display avec la ressource', ressource);
      //les params minimaux
      if (!ressource.oid || !ressource.titre || !ressource.parametres) {
        throw new Error("Paramètres manquants");
      }

      // On réinitialise le conteneur
      S.empty(container);
      S.addElement(container, 'svg', {id:'svg', width:"100%", height:"500px"})
      require(['http://iep.sesamath.net/iepmin.js', 'Mathjax'], function () {
        /*global MathJax*/
        MathJax.Hub.Config({
          tex2jax: {
            inlineMath: [["$","$"],["\\(","\\)"]]
          },
          jax: ["input/TeX","output/SVG"],
          TeX: {extensions: ["color.js"]},
          messageStyle:'none'
        });
        MathJax.Hub.Queue(function() {

        });
      });
    };

    return iep;
  });
} catch (error) {
  if (typeof console !== 'undefined' && console.error) {
    console.error("Il fallait probablement appeler init avant ce module");
    console.error(error);
  }
}