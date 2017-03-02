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

const myBaseId = config.application.baseId
const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum

const name = 'nettoyage des rid ou aliasOf avec une baseId default'
const description = ''

const limit = 100

const bad = 'default/'
const good = myBaseId + '/'

/**
 * Retourne la liste d'enfants mis au nouveau format
 * @param enfants
 */
function cleanArbre (arbre) {
  let hasChanged = false
  const enfants = arbre.enfants.map(enfant => {
    if (enfant.aliasOf && enfant.aliasOf.indexOf(bad) === 0) {
      hasChanged = true
      enfant.aliasOf = enfant.aliasOf.replace(bad, good)
    }
    if (enfant.type === 'arbre' && enfant.enfants && enfant.enfants.length) hasChanged = cleanArbre(enfant) || hasChanged
    return enfant
  })
  if (hasChanged) arbre.enfants = enfants
  return hasChanged
}

function cleanRessource (ressource) {
  let hasChanged = false
  if (ressource.aliasOf && ressource.aliasOf.indexOf(bad) === 0) {
    ressource.aliasOf = ressource.aliasOf.replace(bad, good)
    hasChanged = true
  }
  if (ressource.rid && ressource.rid.indexOf(bad) === 0) {
    ressource.rid = ressource.rid.replace(bad, good)
    hasChanged = true
  }
  return hasChanged
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
        let hasChanged = false
        if (ressource.type === 'arbre' && ressource.enfants.length) hasChanged = cleanArbre(ressource)
        hasChanged = cleanRessource(ressource) || hasChanged
        if (hasChanged) {
          $cacheRessource.delete(ressource.oid)
          ressource.store(this)
        } else {
          this()
        }

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
