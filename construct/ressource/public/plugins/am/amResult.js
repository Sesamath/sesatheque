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
 * @file Script autonome pour afficher un résultat de type am
 * On peut être chargé sur n'importe quelle appli, donc on a aucune dépendance à une lib externe
 * et on exporte 3 fonctions,
 * - soit pour requireJs (si define existe)
 * - soit en module amd (module.exports),
 * et sinon on ne fait rien...
 */
/*global window*/
(function () {
  "use strict";
  // vérif minimale du contexte
  if (typeof window === "undefined") throw new Error("Ce script ne fonctionne que dans un dom html");
  if (typeof window.document === "undefined") throw new Error("Ce script ne fonctionne que dans un dom html");

  /** Raccourci pour window.document */
  var wd = window.document;
  /** Notre module exporté */
  var amResult = {};

  /**
   * Retourne le code html qui affiche le bilan (ici la durée d'affichage)
   * @param {Resultat} resultat L'objet Resultat dont on veut le bilan
   * @param {string}   baseUrl  Le prefix d'url de notre dossier sans / de fin
   * @returns {string} Le code html
   */
  amResult.getHtmlReponse = function (resultat) {
    var output = "";
    // pour url on a pas de resultat.reponse, seule la durée peut servir
    if (resultat.duree > 0) {
      output = "affiché pendant ";
      if (resultat.duree > 59) {
        output += Math.floor(resultat.duree / 60) + ' minutes ';
      }
      output += resultat.duree % 60 +' s';
    } else {
      output = "pas de durée d'affichage connue";
    }

    return output;
  };

  /**
   * Retourne le code html qui affiche le score (ici "affiché")
   * @param {Resultat} resultat
   * @returns {string} Le code html
   */
  amResult.getHtmlScore = function () {
    return "affiché";
  };

  /**
   * Affiche score et réponse dans un HTMLElement
   * @param resultat
   * @param element
   * @param baseUrl
   */
  amResult.showResult = function (resultat, element, baseUrl) {
    var html = amResult.getHtmlReponse(resultat, baseUrl);
    element.addChild(wd.createTextNode(html));
  };

  // suivant ce qui est dispo, on exporte pour requireJs, en module amd (pour node ou browserify) ou dans le dom global
  if (typeof define === 'function') {
    define(amResult); // jshint ignore:line
  } else if (typeof module === 'object' && module.exports) {
    module.exports = amResult;
  }
})();
