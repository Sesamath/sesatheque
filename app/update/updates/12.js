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

const flow = require('an-flow')
const applog = require('an-log')(lassi.settings.application.name)
const config = require('../../config')
const Ref = require('../../constructors/Ref')

const myBaseId = config.application.baseId
const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum

const name = 'conversion des ressources (ajout rid, pid pour les auteurs) et ref (dans les arbres)'
const description = ''

const limit = 100

/**
 * Retourne la liste d'enfants mis au nouveau format
 * @param enfants
 */
function cleanEnfants (enfants) {
  return enfants.map(enfant => {
    const refEnfant = new Ref(enfant, myBaseId)
    if (refEnfant.baseId) delete refEnfant.baseId
    if (refEnfant.ref) delete refEnfant.ref
    if (refEnfant.enfants && refEnfant.enfants.length) {
      if (refEnfant.type === 'arbre') {
        refEnfant.enfants = cleanEnfants(refEnfant.enfants)
      } else {
        log.errorData('enfants sur autre chose qu’un arbre', refEnfant)
        delete refEnfant.enfants
      }
    }
    return refEnfant
  })
}

/**
 * Nettoie les enfants de l'arbre
 * @param {Ressource} arbre
 */
function cleanArbre (arbre) {
  if (arbre.enfants) {
    if (arbre.enfants.length) arbre.enfants = cleanEnfants(arbre.enfants)
  } else {
    log.errorData('arbre sans propriété enfants', arbre)
    arbre.enfants = []
  }
  if (arbre.parametres) {
    log.errorData('arbre avec parametres', arbre)
    delete arbre.parametres
  }
  return arbre
}

/**
 * Change auteurs, contributeurs et auteursParents pour remplacer oid par pid
 * @param {Ressource} ressource
 */
function cleanAuteurs (ressource) {
  ['auteurs', 'contributeurs', 'auteursParents'].forEach(p => {
    if (ressource[p] && ressource[p].length) ressource[p] = ressource[p].map(id => String(id).indexOf('/') === -1 ? myBaseId + '/' + id : id)
  })
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

      // on itère
      }).seqEach(function (ressource) {
        if (ressource.type === 'arbre') {
          ressource = cleanArbre(ressource)
        } else if (ressource.enfants) {
          if (ressource.enfants.length) log.errorData('enfants sur autre chose qu’un arbre', ressource)
          delete ressource.enfants
        }
        cleanAuteurs(ressource)
        $cacheRessource.delete(ressource.oid)
        ressource.store(this)

      // log + suivants ou fin
      }).seq(function () {
        applog(updatePrefix, 'appliqué de', offset, 'à', offset + currentTotal - 1, 'sur', nbRessources)
        if (currentTotal === limit) {
          offset += limit
          setTimeout(grab, 0)
        } else {
          next()
        }
      }).catch(next)
    }
    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')
    let offset = 0
    let nbRessources = 0

    // on compte et on y va
    EntityRessource.match().count(function (error, total) {
      if (error) return next(error)
      applog(updatePrefix, name, 'avec', total, 'ressources à traiter')
      if (total === 0) return next()
      nbRessources = total
      grab()
    })
  } // run
}
