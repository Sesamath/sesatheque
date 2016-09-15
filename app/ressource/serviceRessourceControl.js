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
var sTools = require('sesajstools')
var rTools = require('../tools/ressource')

var config = require('./config')

/**
 * Ajoute les propriétés qui peuvent être déduites (deductions définies dans la configuration)
 * - categories si vide et que type permet de le deviner
 * - typePedagogiques et typeDocumentaires si categories n'en contient qu'une et qu'elle permet de les déduire
 * @private
 * @param {Ressource} ressource une ressource (ou des datas qui y ressemblent)
 */
function addDeductions (ressource) {
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
 * Cast une valeur d'une propriété de ressource dans le bon type
 * @private
 * @param ressource
 * @param prop
 */
function castValue (ressource, prop) {
  var typeWanted = config.typesVar[prop]
  var value = ressource[prop]
  if (typeof value === typeWanted.toLowerCase() || typeWanted === 'Array' && _.isArray(value)) {
    return log.error('castValue appelé sans cast à faire')
  }
  var label = config.labels[prop]
  var buffer
  if (typeWanted === 'String') {
    // on tolère les nombres
    if (typeof value === 'number') ressource[prop] = value.toString()
    else rTools.addError(ressource, 'Le champ ' + label + " n'est pas une chaine de caractères")
  } else if (typeWanted === 'Date') {
    buffer = tools.toDate(value)
    if (buffer) ressource[prop] = buffer
    else rTools.addError(ressource, 'Le champ ' + label + ' vaut ' + value + " qui n'est pas une date valide")
  } else if (typeWanted === 'Number') {
    buffer = Number(value)
    if (sTools.isIntPos(buffer)) ressource[prop] = buffer
    else rTools.addError(ressource, 'Le champ ' + label + ' vaut ' + value + " qui n'est pas un entier positif")
  } else if (typeWanted === 'Boolean') {
    if (value === 'true' || value == 1) ressource[prop] = true // eslint-disable-line eqeqeq
    else if (value === 'false' || value == 0) ressource[prop] = false // eslint-disable-line eqeqeq
    else rTools.addError(ressource, 'Le champ ' + label + ' vaut ' + value + " qui n'est pas un booléen")
  } else if (typeWanted === 'Array') {
    // on veut une string '[1,2]'
    if (_.isString(value) && value.substr(0, 1) === '[' && value.substr(-1) === ']') {
      try {
        buffer = JSON.parse(value)
        ressource[prop] = tools.integerify(buffer) // c'était du json valide
      } catch (e) {
        rTools.addError(ressource, 'Le champ ' + label + ' vaut ' + value + " qui n'est pas une liste")
      }
    } else {
      rTools.addError(ressource, 'Le champ ' + label + " n'est pas une liste")
    }
  } else if (typeWanted === 'Object') {
    if (_.isString(value)) {
      try {
        buffer = JSON.parse(value)
        ressource[prop] = buffer
        if (prop === 'enfants') {
          $ressourceControl.getEnfantsErrors(buffer, ressource.titre).forEach(function (errorMsg) {
            rTools.addError(ressource, errorMsg)
          })
        }
      } catch (e) {
        rTools.addError(ressource, 'Le champ ' + label + " n'est pas du json valide : " + e.toString())
      }
    } else {
      // normal qu'il en manque à la création
      if (ressource.oid) rTools.addError(ressource, 'Le champ ' + label + ' est invalide : ')
    }
  } else {
    var msg = 'Le champ ' + label + " est d'un type non prévu (" + typeWanted + ')'
    rTools.addError(ressource, msg)
    log.error(msg)
  } // fin des cast
}

/**
 * Vérifie que tous les champs qui doivent être des array le sont et met des tableaux vides sinon
 * @private
 * @param {Ressource} ressource
 */
function normalizeArrays (ressource) {
  _.each(config.typesVar, function (typeVar, key) {
    if (typeVar === 'Array' && !_.isArray(ressource[key])) {
      if (_.isString(ressource[key])) {
        // on voulait un array et on a une string, on découpe
        ressource[key] = sTools.splitAndTrim(ressource[key])
      } else {
        if (typeof ressource[key] !== 'undefined') {
          log.error(new Error('la propriété ' + key + ' de la ressource ' + ressource.oid +
            ' n’était pas un array ni une string (' + typeof ressource[key] + '), init avec array vide'))
        }
        ressource[key] = []
      }
    }
  })
}

/**
 * Service de validation / controle du contenu d'une ressource
 * @service $ressourceControl
 * @requires EntityRessource
 */
var $ressourceControl = {}

module.exports = function (EntityRessource) {
  /**
   * Ajoute des warnings éventuels (arbre sans enfants ou catégorie mise à 'non défini')
   * @private
   * @param ressource
   */
  function addWarnings (ressource) {
    // on ajoute un warning pour les enfants
    log('ressource dans addWarnings', ressource, 'form', {max: 2000})
    // on désactive ça car à la création c'est normal, on verra plus tard
    /* if (ressource.type === 'arbre' && !ressource.new && (!ressource.enfants || !ressource.enfants.length)) {
      rTools.addWarning(ressource, 'arbre sans enfants')
    } */
    // la catégorie non définie
    if (!ressource.categories || ressource.categories[0] === config.constantes.categories.aucune) {
      rTools.addWarning(ressource, 'pas de catégorie définie')
    }
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
   * @param {object} ressource objet qui provient d'un post (toutes les valeurs sont des strings, les boolean sont sous la forme checkbox
   * @param {boolean} [partial=false] Passer true pour ne faire que les conversion de type
   *                                sans renvoyer une erreur pour les champs manquants
   * @param {Function} next Callback appelé en synchrone qui recevra les arguments (error, ressource)
   *                        ressource pourra avoir _errors ou _warnings (cast éventuels effectués)
   */
  $ressourceControl.valide = function (ressource, partial, next) {
    log.debug('ressource dans valide', ressource, 'form', {max: 2000})
    if (!next) {
      next = partial
      partial = false
    }
    var strict = !partial
    if (!next) throw new Error('pas de callback fournie')
    if (_.isEmpty(ressource)) return next(new Error('Ressource vide'))
    // normalisation basique
    normalizeArrays(ressource)
    addDeductions(ressource)
    // vérif présence et type, on boucle sur typesVar
    _.each(config.typesVar, function (typeVar, prop) {
      var label = config.labels[prop]
      var value = ressource[prop]

      // propriétés obligatoires
      if (strict && config.required[prop]) {
        // un checkbox false est [false]
        if (!value || sTools.isArrayEmpty(value)) {
          rTools.addError(ressource, 'Le champ ' + label + ' est obligatoire ')
          log.errorData(ressource.oid + ' a une valeur requise manquante : ' + prop + ' => ' + tools.stringify(value))
        }
      }

      // vérif des types et cast éventuel
      if (typeof value !== 'undefined') {
        if (!_['is' + typeVar](value)) {
          // pas le bon type, on tente du cast
          castValue(ressource, prop)
        } else if (typeVar === 'Number') {
          // c'est bien un number mais on vérifie quand même entier positif
          if (parseInt(value, 10) !== value) rTools.addError(ressource, 'Le champ ' + label + ' ne contient pas un entier')
          if (value < 0) rTools.addError(ressource, 'Le champ ' + label + ' ne contient pas un entier positif')
        } else if (typeVar === 'Array') {
          // c'est déjà un array, on passe les strings d'entiers en entiers
          ressource[prop] = tools.integerify(value)
        }
      }
    }) // fin each

    addWarnings(ressource)

    next(null, ressource)
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
    if (_.isEmpty(data)) return next(new Error('Ressource vide'))
    // log.debug('data reçues en post', data, 'html', {max:500})
    if (data.ressource) {
      // on nous envoie la ressource en json dans une string
      try {
        data = JSON.parse(data.ressource)
      } catch (error) {
        return next(new Error('json invalide dans la propriété ressource postée'))
      }
    }

    // on peut tenter une validation
    $ressourceControl.valide(data, partial, function (error, ressource) {
      if (error) {
        // en cas de pb de validation on renvoie aussi la ressource à l'origine du pb, éventuellement un peu nettoyée
        next(error, ressource)
      } else if (partial) {
        // si partiel, faut pas retourner un objet ressource complet mais seulement ce que l'on a construit à partir des datas
        next(null, ressource)
      } else {
        // mais sinon on renvoie une vraie 'Ressource'
        var objRessource = EntityRessource.create(ressource)
        next(null, objRessource)
      }
    })
  }

  return $ressourceControl
}
