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
 * Ressource calculatice en flash
 * ex 5894 et suivants
 */
/*global define, log, container, window */

define(['sesaswf'], function (sesaswf) {
  'use strict';
  /** Le module exporté avec sa méthode display */
  var ec2 = {};
  var baseEc2 = "http://www.labomep.net/exercices_calculatice";

  // charger_options et enregistrer_score exportées dans le dom global par display

  /**
   * Affiche la ressource dans l'élément d'id mepRess
   * @param {Object}   ressource  L'objet ressource tel qu'il sort de la bdd
   * @param {Object}   options    Les options (baseUrl, vendorsBaseUrl, container, errorsContainer,
   *                              et éventuellement resultCallback)
   * @param {Function} next       La fct à appeler quand le swf sera chargé (sans argument ou avec une erreur)
   */
  ec2.display = function (ressource, options, next) {
    var swfUrl;

    log('start ec2 display avec la ressource', ressource)
    //les params minimaux
    if (!ressource.oid || !ressource.titre || !ressource.parametres || !ressource.parametres.swf) {
      throw new Error("Paramètres manquants");
    }
    // le swf
    swfUrl = baseEc2 + '/' + ressource.parametres.swf;
    // les fcts exportées pour le swf
    var optionsChargement = ressource.parametres.json || "defaut";
    window.charger_options = function () {
      return optionsChargement;
    };

    window.enregistrer_score = function (datasCalculatice) {
      if (options && options.resultCallback) {
        log("résultats reçus", datasCalculatice);
        options.resultCallback({reponse: datasCalculatice});
      }
    };

    // On réinitialise le conteneur
    container.innerHTML = '';

    // on dimensionne le div parent (sinon la moitié du swf pourrait être dehors)
    container.setAttribute("width", 735); // change rien avec ff
    container.style.width = '735px';

    options = {
      largeur  : 735,
      hauteur  : 450,
      base     : baseEc2 + '/',
      flashvars: {
        contexte: 'LaboMEP', // encore utile ça ?
        statut  : 'eleve'
      }
    }

    sesaswf.load(container, swfUrl, options, next);
  }

  return ec2;
});