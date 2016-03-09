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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE,
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

'use strict'

var _ = require('lodash')
var tools = require('../tools')

var config = require('./config')

/**
 * Service de validation / controle du contenu d'une ressource
 * @service $ressourceControl
 * @requires EntityRessource
 */
var $ressourceControl = {}

module.exports = function (EntityRessource) {
  /**
   * Ajoute les propriétés qui peuvent être déduites (deductions définies dans la configuration)
   * - categories si vide et que type permet de le deviner
   * - typePedagogiques et typeDocumentaires si categories n'en contient qu'une et qu'elle permet de les déduire
   * @private
   * @param {EntityRessource} ressource une ressource (ou des datas qui y ressemblent)
   */
  function addDeductions (ressource) {
    // on normalise ces champs pour être sûr d'avoir des array
    if (!_.isArray(ressource.categories)) ressource.categories = []
    if (!_.isArray(ressource.typePedagogiques)) ressource.typePedagogiques = []
    if (!_.isArray(ressource.typeDocumentaires)) ressource.typeDocumentaires = []
    // si categories absent on essaie de le déduire de type
    if (ressource && ressource.type && _.isEmpty(ressource.categories) && config.typeToCategories[ressource.type]) {
      ressource.categories = config.typeToCategories[ressource.type]
    }
    // puis typePedagogiques et typeDocumentaires d'après catégories
    if (ressource && ressource.categories && ressource.categories.length) {
      var noTp = _.isEmpty(ressource.typePedagogiques)
      var noTd = _.isEmpty(ressource.typeDocumentaires)
      if (noTp || noTd) {
        // on se penche sur la question
        ressource.categories.forEach(function (categorie) {
          if (config.categoriesToTypes[categorie]) {
            if (noTp) {
              config.categoriesToTypes[categorie].typePedagogiques.forEach(function (tp) {
                ressource.typePedagogiques.push(tp)
              })
            }
            if (noTd) {
              if (!_.isArray(ressource.typeDocumentaires)) ressource.typeDocumentaires = []
              config.categoriesToTypes[categorie].typeDocumentaires.forEach(function (tp) {
                ressource.typeDocumentaires.push(tp)
              })
            }
          }
        })
      }
    }
  }

  /**
   * Ajoute des warnings éventuels (arbre sans enfants ou catégorie mise à 'non défini')
   * @private
   * @param ressource
   */
  function addWarnings (ressource) {
    function addWarning (warning) {
      if (!ressource._warnings) ressource._warnings = []
      ressource._warnings.push(warning)
    }
    // on ajoute un warning pour les enfants
    if (ressource.type === 'arbre' && (!ressource.enfants || !ressource.enfants.length)) {
      addWarning('arbre sans enfants')
    }
    // la catégorie non définie
    if (!ressource.categories || ressource.categories[0] === config.constantes.categories.aucune) {
      addWarning('pas de catégorie définie')
    }
  }

  /**
   * Vérifie que tous les champs qui doivent être des array le sont et met des tableaux vides sinon
   * @private
   * @param {EntityRessource} ressource
   */
  function normalizeArrays (ressource) {
    _.each(config.typesVar, function (typeVar, key) {
      var tmp
      if (ressource.hasOwnProperty(key) && typeVar === 'Array' && !_.isArray(ressource[key])) {
        if (_.isString(ressource[key])) {
          // on voulait un array et on a une string, on découpe
          tmp = ressource[key].split(',')
          ressource[key] = []
          tmp.forEach(function (val) {
            var value = val.trim()
            if (value) ressource[key].push(value)
          })
        } else {
          log.error(new Error('la propriété ' + key + 'de la ressource' + ressource.oid + " n'était pas un array ni une string, init avec array vide"))
          ressource[key] = []
        }
      }
    })
  }

  $ressourceControl.checkExtKeys = function (ressource, next) {

  }

  /**
   * Retourne la liste des erreurs rencontrées lors du parsing des enfants
   * @memberOf $ressourceControl
   * @param enfants
   * @param titreParent Pour rendre les messages d'erreurs plus précis
   * @return {Array}
   */
  $ressourceControl.getEnfantsErrors = function (enfants, titreParent) {
    var errors = []
    titreParent = titreParent || 'la racine'
    if (_.isArray(enfants)) {
      enfants.forEach(function (enfant, i) {
        if (!enfant.titre) errors.push("L'enfant d'index " + i + ' de « ' + titreParent + " » n'a pas de titre")
        if (!enfant.type) errors.push("L'enfant d'index " + i + " n'a pas de type")
        if (enfant.type !== 'arbre' && !enfant.ref) {
          errors.push("L'enfant d'index ' + i + ' de ' +titreParent +' n'a pas de ref valide")
        } else if (enfant.ref < 1 && (typeof enfant.ref !== 'string' || !/^[\w]+\/[\w]+$/.exec(enfant.ref))) {
          errors.push("L'enfant d'index ' + i + ' de ' +titreParent +' n'a pas de ref valide")
        }
        if (enfant.enfants && enfant.enfants.length) {
          var newErrors = $ressourceControl.getEnfantsErrors(enfant.enfants, enfant.titre)
          if (newErrors.length) Array.prototype.push.apply(errors, newErrors)
        }
      })
    } else {
      errors.push("Enfants doit être un tableau d'Alias")
    }

    return errors
  }

  /**
   * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
   * Fait du cast sans râler quand les propriétés de ressource sont 'presque" du bon type
   * @memberOf $ressourceControl
   * @param {EntityRessource} ressource
   * @param {boolean} [strict=true] Passer false pour ne faire que les conversion de type
   *                                sans renvoyer une erreur pour les champs manquants
   * @param {Function} next Callback appelé en synchrone qui recevra les arguments (error, ressource)
   *                        Si error est vide, la ressource est valide
   *                        Sinon renvoie la ressource avec ses errors (+warnings éventuels, cast éventuels effectués)
   */
  $ressourceControl.valide = function (ressource, strict, next) {
    /**
     * erreur qui sera passée à next
     * @private
     * @type {Error}
     */
    var error = null
    /**
     * tableau de messages d'erreur qui sera concaténé dans error
     * @private
     * @type {Array}
     */
    var errors = []
    if (!next) {
      next = strict
      strict = true
    }
    if (!next) throw new Error('pas de callback fournie')

    if (_.isEmpty(ressource)) {
      errors.push('Ressource vide')
    } else {
      normalizeArrays(ressource)
      addDeductions(ressource)
      // vérif présence et type, on boucle sur typesVar
      _.each(config.typesVar, function (typeVar, key) {
        var champ = config.labels[key]
        var value = ressource[key]
        var buffer

        // propriétés obligatoires
        if (strict && config.required[key]) {
          // un checkbox false est [false]
          if (!value || (value instanceof Array && !value.length)) {
            errors.push('Le champ ' + config.labels[key] + ' est obligatoire ')
            log.errorData(ressource.oid + ' a une valeur requise manquante : ' + key + ' => ' + tools.stringify(value))
          }
        }

        // vérif des types et cast éventuel
        if (typeof value !== 'undefined') {
          if (!_['is' + typeVar](value)) {
            // pas le bon type, on tente du cast

            if (typeVar === 'String') {
              // on tolère les nombres
              if (typeof value === 'number') ressource[key] = value.toString()
              else errors.push('Le champ ' + champ + " n'est pas une chaine de caractères")
            } else if (typeVar === 'Date') {
              buffer = tools.toDate(value)
              if (buffer) ressource[key] = buffer
              else errors.push('Le champ ' + champ + ' vaut ' + value + " qui n'est pas une date valide")
            } else if (typeVar === 'Number') {
              buffer = parseInt(value, 10)
              if (buffer == value && buffer > -1) ressource[key] = buffer // eslint-disable-line eqeqeq
              else errors.push('Le champ ' + champ + ' vaut ' + value + " qui n'est pas un entier positif")
            } else if (typeVar === 'Boolean') {
              if (value === 'true' || value === 1) ressource[key] = true
              else if (value === 'false' || value === 0) ressource[key] = false
              else errors.push('Le champ ' + champ + ' vaut ' + value + " qui n'est pas un booléen")
            } else if (typeVar === 'Array') {
              // on veut une string '[1,2]'
              if (_.isString(value) && value.substr(0, 1) === '[' && value.substr(-1) === ']') {
                try {
                  buffer = JSON.parse(value)
                  ressource[key] = tools.integerify(buffer) // c'était du json valide
                } catch (e) {
                  errors.push('Le champ ' + champ + ' vaut ' + value + " qui n'est pas une liste")
                }
              } else {
                errors.push('Le champ ' + champ + " n'est pas une liste")
              }
            } else if (typeVar === 'Object') {
              if (_.isString(value)) {
                try {
                  buffer = JSON.parse(value)
                  if (key === 'enfants') {
                    var errEnfants = $ressourceControl.getEnfantsErrors(buffer, ressource.titre)
                    if (errEnfants && errEnfants.length) {
                      ressource[key] = value
                      Array.prototype.push.apply(errors, errEnfants)
                    } else {
                      ressource[key] = buffer
                    }
                  } else {
                    ressource[key] = buffer
                  }
                } catch (e) {
                  errors.push('Le champ ' + champ + " n'est pas du json valide : " + e.toString())
                }
              } else if (ressource.oid) {
                errors.push('Le champ ' + champ + ' est invalide : ')
              } // else normal qu'il en manque à la création
            } else {
              var msg = 'Le champ ' + champ + " est d'un type non prévu (" + typeVar + ')'
              errors.push(msg)
              log.error(msg)
            } // fin des cast

            // log.debug('à la validation on a reçu pour ' + key +' (pas ' +typeVar +') la valeur : ', value)

            // pour le reste c'est le bon type, mais on ajoute qq vérifs ou traitement
          } else if (typeVar === 'Number') {
            // c'est bien un number mais on vérifie quand même entier positif
            if (parseInt(value, 10) !== value) errors.push('Le champ ' + config.labels[key] + ' ne contient pas un entier')
            if (value < 0) errors.push('Le champ ' + config.labels[key] + ' ne contient pas un entier positif')
          } else if (typeVar === 'Array') {
            // et pour les array on passe les strings d'entiers en entiers
            ressource[key] = tools.integerify(value)
          }
        }
      }) // fin each

      // pour les arbres, on switch parametres / enfants si besoin
      if (ressource.type === 'arbre') {
        if (!_.isEmpty(ressource.parametres) && _.isEmpty(ressource.enfants)) {
          ressource.enfants = ressource.parametres
          delete ressource.parametres
        }
      } else {
        if (_.isEmpty(ressource.parametres) && !_.isEmpty(ressource.enfants)) {
          log('Bizarre, arbre transformé en ' + ressource.type)
          ressource.parametres = ressource.enfants
          delete ressource.enfants
        }
      }
      addWarnings(ressource)
      // log.debug('après addWarnings', ressource._warnings)
      // log.debug('après addWarnings, enfants de ' +ressource.type, ressource.enfants)
    } // else non vide

    if (errors.length) {
      if (ressource) ressource._errors = errors
    }

    /* nettoyage
    if (ressource._errors && !ressource._errors.length) delete ressource._errors
    if (ressource._warnings && !ressource._warnings.length) delete ressource._warnings */

    next(error, ressource)
  }

  /**
   * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
   * Ajoute des choses dans ressource._warnings ou ressources.errors si besoin (et laisse inchangé les valeurs dans ce cas)
   * @memberOf $ressourceControl
   * @param {Object} data Le post
   * @param {boolean} [partial=false] Passer true pour ne pas générer d'erreur sur des champs requis manquants
   * @param {function} next Si appelé sans error, la ressource est valide,
   *                        sinon y'a une error et des warnings|errors ajouté à la ressource initiale qui est renvoyée modifiée
   */
  $ressourceControl.valideRessourceFromPost = function (data, partial, next) {
    try {
      if (_.isEmpty(data)) throw new Error('Ressource vide')
      // log.debug('data reçues en post', data, 'html', {max:500})
      if (data.ressource) {
        // on nous envoie la ressource en json dans une string
        try {
          data = JSON.parse(data.ressource)
        } catch (error) {
          throw new Error('json invalide dans la propriété ressource postée')
        }
      }

      // on peut tenter une validation
      $ressourceControl.valide(data, !partial, function (error, ressource) {
        // en cas de pb de validation on renvoie aussi la ressource à l'origine du pb, éventuellement un peu nettoyée
        if (error) next(error, ressource)
        // si partiel, faut pas retourner un objet ressource complet mais seulement ce que l'on a construit à partir des datas
        else if (partial) next(null, ressource)
        // mais sinon on renvoie une vraie 'Ressource'
        else {
          var objRessource = EntityRessource.create(ressource)
          next(null, objRessource)
        }
      })
    } catch (error) {
      next(error, data)
    }
  }

  return $ressourceControl
}
