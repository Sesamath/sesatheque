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
module.exports = function () {
  /**
   * Service de validation d'une ressource
   * @namespace $ressourceControl
   * @requires Ressource
   * @requires $accessControl
   * @requires $cacheRessource
   */
  var $ressourceControl = {}

  var _ = require('lodash')
  var tools = require('../tools')

  var config = require('./config')

  /**
   * Ajoute les propriétés qui peuvent être déduites (deductions définies dans la configuration)
   * - categories si vide et que typeTechnique permet de le deviner
   * - typePedagogiques et typeDocumentaires si categories n'en contient qu'une et qu'elle permet de les déduire
   * @param ressource
   */
  $ressourceControl.addDeductions = function (ressource) {
    // on essaie de déduire categories de typeTechnique
    if (ressource && ressource.typeTechnique && _.isEmpty(ressource.categories) && config.typeTechniqueToCategories[ressource.typeTechnique]) {
      ressource.categories = config.typeTechniqueToCategories[ressource.typeTechnique]
    }
    // typePedagogiques et typeDocumentaires d'après catégories (si une seule)
    if (ressource && ressource.categories && ressource.categories.length === 1) {
      var categorie = ressource.categories[0]
      if (config.categoriesToTypes[categorie]) {
        if (_.isEmpty(ressource.typePedagogiques)) ressource.typePedagogiques = config.categoriesToTypes[categorie].typePedagogiques
        if (_.isEmpty(ressource.typeDocumentaires)) ressource.typeDocumentaires = config.categoriesToTypes[categorie].typeDocumentaires
      }
    }
  }

  /**
   * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
   * Fait du cast sans râler quand les propriétés de ressource sont "presque" du bon type
   * @param {Ressource} ressource
   * @param {boolean} [strict=true] Passer false pour ne faire que les conversion de type
   *                                sans renvoyer une erreur pour les champs manquants
   * @param {Function} next Callback appelé en synchrone qui recevra les arguments (error, ressource)
   */
  $ressourceControl.valide = function(ressource, strict, next) {
    if (!next) {
      next = strict
      strict = true
    }
    if (!next) throw new Error('pas de callback fournie')

    /** tableau d'erreurs qui sera concaténé et passé à next si non vide */
    var errors = []

    if (_.isEmpty(ressource)) {
      errors.push("Ressource vide");
    } else {
      $ressourceControl.addDeductions(ressource)
      // vérif présence et type
      _.each(config.typesVar, function (typeVar, key) {
        var champ = config.labels[key]
        var value = ressource[key]
        var buffer

        // propriétés obligatoires
        if (strict && config.required[key]) {
          if (!value || (value instanceof Array && !value.length)) {
            errors.push("Le champ " + config.labels[key] + " est obligatoire ")
            log.errorData(ressource.oid +' a une valeur requise manquante : ' +key +' => ' +tools.stringify(value))
          }
        }

        // vérif des types et cast éventuel
        if (value) {
          if (!_['is' + typeVar](value)) {
            // on tente du cast

            if (typeVar === 'String') {
              // on tolère les nombres
              if (typeof value === 'number') ressource[key] = value.toString()
              else errors.push("Le champ " + champ + " n'est pas une chaine de caractères")

            } else if (typeVar === 'Date') {
              buffer = tools.toDate(value)
              if (buffer) ressource[key] = buffer
              else errors.push("Le champ " + champ +' vaut ' +value +" qui n'est pas une date valide")

            } else if (typeVar === 'Number') {
              buffer = parseInt(value, 10)
              if (buffer == value && buffer > -1) ressource[key] = buffer
              else errors.push("Le champ " + champ +' vaut ' +value +" qui n'est pas un entier positif")

            } else if (typeVar === 'Boolean') {
              if (value === 'true' || value === 1) ressource[key] = true
              else if (value === 'false' || value === 0) ressource[key] = false
              else errors.push("Le champ " + champ +' vaut ' +value +" qui n'est pas un booléen")

            } else if (typeVar === 'Array') {
              if (_.isArray(value)) {
                ressource[key] = tools.integerify(value)
              } else if (_.isString(value) && value.substr(0,1) === '[' && value.substr(-1) === ']') {
                // on tolère une string "[1,2]"
                try {
                  buffer = JSON.parse(value)
                  ressource[key] = tools.integerify(buffer) // c'était du json valide
                } catch (e) {
                  errors.push("Le champ " + champ +' vaut ' +value +" qui n'est pas une liste");
                }
              } else {
                errors.push("Le champ " + champ + " n'est pas une liste");
              }

            } else if (typeVar === 'Object') {
              if (_.isString(value)) {
                try {
                  ressource[key] = JSON.parse(value);
                } catch (e) {
                  errors.push("Le champ " + champ + " n'est pas du json valide : " + e.toString());
                }
              } else {
                errors.push("Le champ " + champ + " est invalide : ");
              }

            } else {
              var msg = "Le champ " + champ + " est d'un type non prévu (" +typeVar +')';
              errors.push(msg);
              log.error(msg);
            } // cast

            //log.debug("à la validation on a reçu pour " + key +' (pas ' +typeVar +') la valeur : ', value)

            // pour le reste c'est le bon type, mais on ajoute qq vérifs ou traitement

          } else if (typeVar === 'Number') {
            // c'est bien un number mais on vérifie quand même entier positif
            if (parseInt(value, 10) !== value) errors.push("Le champ " + config.labels[key] + " ne contient pas un entier");
            if (value < 0) errors.push("Le champ " + config.labels[key] + " ne contient pas un entier positif");

          } else if (typeVar === 'Array') {
            // et pour les array on passe les strings d'entiers en entiers
            ressource[key] = tools.integerify(value)
          }
        }
      }) // fin each
    }

    if (errors.length) errors = new Error("Ressource invalide : \n" + errors.join("\n"))
    else errors = null
    next(errors, ressource)
  }

  return $ressourceControl
}
