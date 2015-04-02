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

'use strict';

/**
 * Init de notre service $ressourceControl
 */
module.exports = function (idInitial) {
  /**
   * Service de validation d'une ressource
   * @namespace $ressourceControl
   * @requires Ressource
   * @requires $accessControl
   * @requires $cacheRessource
   */
  var $ressourceControl = {}

  var _ = require('lodash')

  var config = require('./config')

  /**
   * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
   * @param {Ressource} ressource
   * @param {Function} next Callback appelé en synchrone qui recevra les arguments (error, ressource)
   */
  $ressourceControl.valide = function(ressource, next) {
    // log.debug('on va valider ', ressource)
    /** tableau d'erreurs qui sera concaténé et passé à next si non vide */
    var errors = [];
    if (_.isEmpty(ressource)) {
      errors.push("Ressource vide");
    } else {
      // vérif présence et type
      _.each(config.typesVar, function (typeVar, key) {
        // propriétés obligatoires
        if (_.isEmpty(ressource[key]) && config.required[key]) {
          errors.push("Le champ " + config.labels[key] + " est obligatoire")
        }
        // le type
        if (ressource[key] && ! _['is' + typeVar](ressource[key])) {
          errors.push("Le champ " + config.labels[key] + " ne contient pas le type attendu");
          log.debug("à la validation on a reçu pour " + key, ressource[key])
        } else if (typeVar === 'Number') {
          // on vérifie entier positif
          if (Math.floor(ressource[key]) !== ressource[key]) {
            errors.push("Le champ " + config.labels[key] + " ne contient pas un entier");
          }
          if (ressource[key] < 0) {
            errors.push("Le champ " + config.labels[key] + " ne contient pas un entier positif");
          }
        }
      })
    }

    if (next) {
      if (errors.length) {
        // on passe les erreurs mais pas la ressource invalide
        next(new Error("Ressource invalide : \n" + errors.join("\n")))
      } else {
        next(null, ressource)
      }
    }
  }

  return $ressourceControl
}
