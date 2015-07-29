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
 * @file Script autonome pour afficher un résultat d'un exercice de type em
 */
/*global window*/
(function () {
  "use strict";

  // vérif minimale du contexte
  if (typeof window === "undefined") throw new Error("Ce script ne fonctionne que dans un dom html");
  if (typeof window.document === "undefined") throw new Error("Ce script ne fonctionne que dans un dom html");
  if (typeof window.sesatheque === "undefined") window.sesatheque = {};
  if (typeof window.sesatheque.em === "undefined") window.sesatheque.em = {};

  /** Raccourci pour window.document */
  var wd = window.document;
  /**
   * Peut être chargé sur n'importe quelle appli, sans dépendance à une lib externe
   * Exporte 3 méthodes,
   * - soit pour requireJs (si define existe)
   * - soit en module amd (si on a module.exports)
   * - soit dans window.sesatheque.emResult
   * @service emResult
   */
  var emResult = {};

  /**
   * Retourne le code html qui affiche le bilan (ici les carrés colorés)
   * @memberOf emResult
   * @param {Resultat} resultat L'objet Resultat dont on veut le bilan
   * @param {string}   baseUrl  Le prefix d'url de notre dossier sans / de fin
   * @returns {string} Le code html
   */
  emResult.getHtmlReponse = function (resultat, baseUrl) {
    var output = "";
    // pour em on s'attend à avoir resultat.reponse sous la forme d'une chaine vvprbb
    if (typeof resultat.reponse === "string") {
      for (var i = 0; i < resultat.reponse.length; i++) {
        output += '<img src="' +baseUrl +'/images/reponse_' +resultat.reponse[i] +
        '.gif" width="10" height="15" alt="">';
      }
    } else {
      output = "pas de réponse ou réponse à un mauvais format";
    }

    return output;
  };

  /**
   * Retourne le code html qui affiche le score (ici x/y)
   * @memberOf emResult
   * @param {Resultat} resultat
   * @returns {string} Le code html
   */
  emResult.getHtmlScore = function (resultat) {
    var output = "";
    var nbok = 0;
    var nbq, lettre;
    // pour em on s'attend à avoir resultat.reponse sous la forme d'une chaine vvprbb
    if (typeof resultat.reponse === "string") {
      nbq = resultat.reponse.length;
      lettre = resultat.reponse[i];
      for (var i = 0; i < nbq; i++) {
        if (lettre === 'v' || lettre === 'p') nbok++;
      }
      output = nbok +' / ' +nbq;
    } else {
      output = "pas de réponse ou réponse à un mauvais format";
    }

    return output;
  };

  /**
   * Affiche score et réponse dans un HTMLElement
   * @memberOf emResult
   * @param resultat
   * @param element
   * @param baseUrl
   */
  emResult.showResult = function (resultat, element, baseUrl) {
    var html = window.sesatheque.em.getHtmlScore(resultat) +' ' +
        window.sesatheque.em.getHtmlReponse(resultat, baseUrl);
    element.addChild(wd.createTextNode(html));
  };

  // suivant ce qui est dispo, on exporte pour requireJs, en module amd (pour node ou browserify) ou dans le dom global
  if (typeof define === 'function') {
    define(emResult); // jshint ignore:line
  } else if (typeof module === 'object' && module.exports) {
    module.exports = emResult;
  } else {
    window.sesatheque.emResult = emResult;
  }

})();
