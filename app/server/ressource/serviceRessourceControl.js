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

const _ = require('lodash')
const sjt = require('sesajstools')
const rTools = require('../tools/ressource')

const config = require('./config')
const appConfig = require('../config')
const myBaseId = appConfig.application.baseId
const Ressource = require('../constructors/Ressource')

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
            if (!Array.isArray(ressource.typeDocumentaires)) ressource.typeDocumentaires = []
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
  // catégorie aucune
  if (ressource.categories[0] === config.constantes.categories.aucune) {
    rTools.addWarning(ressource, 'il faudra choisir une catégorie')
  }
  if (ressource.type === 'arbre') {
    // parsing des éventuels enfants
    if (ressource.enfants && ressource.enfants.length) {
      checkEnfants(ressource.enfants, ressource)
    } else if (ressource.oid) {
      // à la création (sans oid) c'est normal
      rTools.addWarning(ressource, 'arbre sans enfants')
    }
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
    const reCheckAliasOf = /^[-\w]+\/[-\w]+$/
    enfants.forEach(function (enfant, i) {
      if (!enfant.titre) rTools.addError(ressource, `L’enfant n° ${i + 1} de « ${titre} » n’a pas de titre`)
      const errPrefix = `L’enfant « ${enfant.titre} » de « ${titre} »`
      if (!enfant.type) rTools.addError(ressource, `${errPrefix} n'a pas de type`)
      if (enfant.type === 'error') return
      if (enfant.aliasOf) {
        if (typeof enfant.aliasOf !== 'string' || !reCheckAliasOf.test(enfant.aliasOf)) {
          rTools.addError(ressource, `${errPrefix} n’a pas un aliasOf valide`)
        }
      } else {
        if (enfant.type === 'arbre') {
          // aliasOf pas obligatoire mais faudrait des enfants
          if (!enfant.enfants) rTools.addWarning(ressource, `${errPrefix} est un arbre sans enfants ni aliasOf`)
        } else {
          rTools.addError(ressource, `${errPrefix} n'a pas d’aliasOf`)
        }
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
 * @param {ressourceCallback} next Callback appelé en synchrone qui recevra les arguments (error, ressource)
 *                        ressource pourra avoir $errors ou $warnings (cast éventuels effectués)
 */
function valide (data, next) {
  log.debug('ressource dans valide', data, 'form', {max: 2000})
  if (!next) throw new Error('pas de callback fournie')
  if (_.isEmpty(data)) return next(new Error('Ressource vide'))
  // parsing des propriétés qui pourraient être envoyées en json
  // par ex les propriétés qui étaient hidden
  _.each(data, function (value, prop) {
    // on parse les string si on attendait Array ou Object
    if (typeof value === 'string' &&
      (config.typesVar[prop] === 'Array' || config.typesVar[prop] === 'Object')
    ) {
      try {
        data[prop] = JSON.parse(value)
      } catch (error) {
        rTools.addError(data, `Le contenu de ${prop} était invalide`)
        delete data[prop] // le constructeur initialisera
      }
    }
  })
  // le constructeur fait office de validateur,
  // log.debug('auteurs avant constructeur', data.auteurs)
  const ressource = new Ressource(data, myBaseId)
  // log.debug('auteurs après constructeur', ressource.auteurs)

  // on ajoute les déductions avant check required car des trucs obligatoires peuvent être déduits du type
  addDeductions(ressource)
  // vérif des required
  _.each(config.required, function (required, prop) {
    if (required && _.isEmpty(ressource[prop])) {
      rTools.addError(ressource, `Le champ ${config.labels[prop]} est obligatoire`)
      log.dataError(ressource.rid + ' a une valeur requise manquante : ' + prop + ' => ' + sjt.stringify(ressource[prop]))
    }
  })
  addWarnings(ressource)

  next(null, ressource)
}

module.exports = function (EntityRessource) {
  /**
   * Converti le post reçu en ressource avec cast sur les propriétés et formatage de date
   * Ajoute des choses dans ressource.$warnings ou ressources.errors si besoin (et laisse inchangé les valeurs dans ce cas)
   * @memberOf $ressourceControl
   * @param {Object} data Le post
   * @param {boolean} [partial=false] Passer true pour ne pas générer d'erreur sur des champs requis manquants
   * @param {function} next Si appelé sans error, la ressource est valide,
   *                        sinon y'a une error et des warnings|errors ajouté à la ressource initiale qui est renvoyée modifiée
   */
  function valideRessourceFromPost (data, next) {
    if (_.isEmpty(data)) return next(new Error('Ressource vide'))
    if (data.ressource) {
      // on nous envoie la ressource en json dans une string
      try {
        data = JSON.parse(data.ressource)
      } catch (error) {
        return next(new Error('json invalide dans la propriété ressource postée'))
      }
    }
    // on peut tenter une validation
    valide(data, next)
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
