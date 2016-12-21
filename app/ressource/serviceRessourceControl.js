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
var sjt = require('sesajstools')
var sjtFilters = require('sesajstools/utils/filters')
var rTools = require('../tools/ressource')

var config = require('./config')
var Ressource = require('../constructors/Ressource')

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
 * Ajoute des warnings éventuels (arbre sans enfants ou catégorie mise à 'non défini')
 * @private
 * @param {Ressource} ressource
 */
function addWarnings (ressource) {
  // catégories
  if (!ressource.categories || ressource.categories.length === 0 || ressource.categories[0] === config.constantes.categories.aucune) {
    rTools.addWarning(ressource, 'pas de catégorie définie')
  }
  // arbre sans enfants (si c'est pas une création, ie avec oid)
  if (ressource.oid && ressource.type === 'arbre' && _.isEmpty(ressource.enfants)) {
    rTools.addWarning(ressource, 'arbre sans enfants')
  }
  // parsing des éventuels enfants
  if (ressource.type === 'arbre' && ressource.enfants && ressource.enfants.length) {
    checkEnfants(ressource.enfants, ressource)
  }
}

/**
 * Ajoute à la ressource les erreurs rencontrées lors du parsing des enfants
 * @private
 * @param {Array}     enfants
 * @param {Ressource} ressource
 * @param {string}    [titre]   Le titre du parent
 */
function checkEnfants (enfants, ressource, titre) {
  if (!titre) titre = ressource.titre
  if (Array.isArray(enfants)) {
    enfants.forEach(function (enfant, i) {
      if (!enfant.titre) rTools.addError(ressource, `L’enfant n° ${i + 1} de « ${titre} » n’a pas de titre`)
      if (!enfant.type) rTools.addError(ressource, `L’enfant ${enfant.titre} de « ${titre} » n'a pas de type`)
      if (enfant.type !== 'arbre' && !enfant.ref) {
        rTools.addError(ressource, `L’enfant ${enfant.titre} de « ${titre} » n'a pas de ref valide`)
      } else if (enfant.ref < 1 && (typeof enfant.ref !== 'string' || !/^[\w]+\/[\w]+$/.exec(enfant.ref))) {
        rTools.addError(ressource, `L’enfant ${enfant.titre} de « ${titre} » n'a pas de ref valide`)
      }
      if (enfant.enfants) {
        checkEnfants(enfant.enfants, ressource, enfant.titre)
      }
    })
  } else {
    rTools.addError(ressource, `enfants de « ${titre} »  invalides (pas une liste)`)
  }
}

/**
 * Vérifie que les champs obligatoires existent et sont non vides, et que les autres sont du type attendu
 * Fait du cast sans râler quand les propriétés de ressource sont 'presque" du bon type
 * @memberOf $ressourceControl
 * @param {object} ressource objet qui provient d'un post (toutes les valeurs sont des strings, les boolean sont sous la forme checkbox
 * @param {boolean} [partial=false] Passer true pour ne faire que les conversion de type
 *                                sans renvoyer une erreur pour les champs manquants
 * @param {ressourceCallback} next Callback appelé en synchrone qui recevra les arguments (error, ressource)
 *                        ressource pourra avoir _errors ou _warnings (cast éventuels effectués)
 */
function valide (data, partial, next) {
  log.debug('ressource dans valide', data, 'form', {max: 2000})
  log.debug('début valide', data.niveaux, 'avirer', {max: 2000})
  if (!next) {
    next = partial
    partial = false
  }
  if (!next) throw new Error('pas de callback fournie')
  if (_.isEmpty(data)) return next(new Error('Ressource vide'))
  // parsing des propriétés qui pourraient être envoyées en json
  _.each(data, function (value, prop) {
    if (typeof value === 'string' && (config.typesVar[prop] === 'Array' || config.typesVar[prop] === 'Object')) {
      try {
        data[prop] = JSON.parse(value)
      } catch (error) {
        rTools.addError(data, `Le contenu de ${prop} était invalide`)
        delete data[prop] // le constructeur initialisera
      }
    }
  })
  let ressource
  if (partial) {
    validePartial(data)
    ressource = data
  } else {
    // le constructeur fait office de validateur,
    ressource = new Ressource(data)
    // vérif des required
    _.each(config.required, function (required, prop) {
      if (required && _.isEmpty(ressource[prop])) {
        rTools.addError(ressource, `Le champ ${config.labels[prop]} est obligatoire`)
        log.errorData(ressource.getId() + ' a une valeur requise manquante : ' + prop + ' => ' + sjt.stringify(ressource[prop]))
      }
    })
  }
  addDeductions(ressource)
  addWarnings(ressource)
  log.debug('fin valide', ressource.niveaux)

  next(null, ressource)
}

/**
 * Vérifie que toutes les propriétés qui existent sont du bon type (cast sinon, avec addError sur les tableaux)
 * @private
 * @param {object} data
 */
function validePartial (data) {
  const retour = {}
  _.each(data, function (value, prop) {
    switch (config.typesVar[prop]) {
      case undefined: rTools.addError(retour, `Le champ ${prop} est inconnu et sera ignoré`); break
      case 'Number': retour[prop] = sjtFilters.int(value); break
      case 'String': retour[prop] = sjtFilters.string(value); break
      case 'Date': retour[prop] = sjtFilters.date(value); break
      case 'Boolean': retour[prop] = sjtFilters.boolean(value); break

      case 'Array':
        // éventuel parsing
        if (typeof value === 'string' && value.substr(0, 1) === '[' && value.substr(-1) === ']') {
          try {
            value = JSON.parse(value)
          } catch (e) {
            rTools.addError(retour, `Le champ ${config.labels[ prop ]} vaut ${value} qui n'est pas une liste correctement formatée`)
          }
        }
        // on doit avoir un array
        if (Array.isArray(value)) {
          // on regarde le contenu
          switch (config.typesVarArray[prop]) {
            case 'Number': retour[prop] = sjtFilters.arrayInt(value); break
            case 'String': retour[prop] = sjtFilters.arrayString(value); break
            case 'Array':
              // normalement relations est le seul dans ce cas
              if (prop !== 'relations') throw new Error(`${prop} non gérée par validePartial`)
              retour[prop] = value.filter((elt) => Array.isArray(elt))
                .map((elt) => sjtFilters.arrayInt(elt))
                .filter((elt) => elt.length === 2)
              if (retour[prop].length < value.length) {
                rTools.addWarning(retour, `${prop} contenait un élément invalide (pas une relation) qui a été ignoré`)
              }
              break
            case 'Object':
              retour[prop] = value.filter((elt) => typeof elt === 'object')
              if (retour[prop].length < value.length) {
                rTools.addWarning(retour, `${prop} contenait un élément invalide qui a été ignoré`)
              }
              break
            default:
              throw new Error(`${prop} déclaré en config comme array mais typesVarArray non déclaré ou non géré`)
          }
        } else {
          rTools.addError(retour, `Le champ ${config.labels[prop]} vaut ${value} qui n'est pas une liste`)
        }
        break

      case 'Object':
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch (e) { /* idem erreur juste dessous */ }
        }
        if (typeof value !== 'object') {
          rTools.addError(retour, `Le champ ${config.labels[prop]} vaut ${value} n'est pas un objet correctement formaté`)
        }
        break

      default:
        throw new Error(`Champ ${prop} déclaré en config mais de type non géré`)
    }
  })
  return retour
}

module.exports = function (EntityRessource) {
  /**
   * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
   * Ajoute des choses dans ressource._warnings ou ressources.errors si besoin (et laisse inchangé les valeurs dans ce cas)
   * @memberOf $ressourceControl
   * @param {Object} data Le post
   * @param {boolean} [partial=false] Passer true pour ne pas générer d'erreur sur des champs requis manquants
   * @param {function} next Si appelé sans error, la ressource est valide,
   *                        sinon y'a une error et des warnings|errors ajouté à la ressource initiale qui est renvoyée modifiée
   */
  function valideRessourceFromPost (data, partial, next) {
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
    valide(data, partial, function (error, ressource) {
      if (error) {
        // en cas de pb de validation on renvoie aussi la ressource à l'origine du pb, éventuellement un peu nettoyée
        next(error, ressource)
      } else if (partial) {
        // si partiel, faut pas retourner un objet ressource complet mais seulement ce que l'on a construit à partir des datas
        next(null, ressource)
      } else {
        // mais sinon on renvoie une vraie entité Ressource
        next(null, EntityRessource.create(ressource))
      }
    })
  }

  /**
   * Service de validation / controle du contenu d'une ressource
   * @service $ressourceControl
   * @requires EntityRessource
   */
  return {
    valide,
    valideRessourceFromPost
  }
}
