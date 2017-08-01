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
const {exists} = require('sesatheque-client/dist/sesatheques')

const config = require('../../config')
const myBaseId = config.application.baseId
const configRessource = require('../../ressource/config')
const knownRelations = configRessource.listes.relations

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)
const updateLogErr = updateLog.error
const logBothErr = (message, obj) => {
  updateLogErr(message)
  log.dataError(message, obj)
}

const name = 'normalisation des rid dans les relations'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    /**
     * Charge toutes les ressources ayant une relation
     * @private
     */
    function grab (next) {
      let nb = 0
      flow().seq(function () {
        EntityRessource.match('relations').sort('oid').grab(limit, offset, this)
      }).seqEach(function (ressource) {
        nb++
        cleanRelations(ressource, this)
      }).seq(function () {
        updateLog(`ressources de ${offset} à ${offset + nb} (sur ${nbTotal}) traitées`)
        if (nb === limit) {
          offset += limit
          process.nextTick(grab, next)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * Nettoie les relations
     * @private
     * @param ressource
     * @param next
     */
    function cleanRelations (ressource, next) {
      if (!ressource.relations || !ressource.relations.length) {
        logBothErr('ressource sans relations', ressource)
        return next()
      }
      let hasChanged = false
      const nbRelations = ressource.relations.length
      ressource.relations = ressource.relations.map((relation) => {
        let [typeRelation, target] = relation
        if (!knownRelations[typeRelation]) {
          logBothErr(`relation ${typeRelation} inconnue pour ${ressource.oid}`)
          return false
        }
        if (typeof target !== 'string') target = String(target)
        if (target.indexOf('/') === -1) {
          if (target === String(ressource.oid)) return false
          hasChanged = true
          // updateLog(`relation de ${ressource.oid} vers [${typeRelation}, ${myBaseId}/${target}]`)
          return [typeRelation, `${myBaseId}/${target}`]
        }
        // y'avait un slash, on vérifie la base
        const [baseId, oid, rest] = target.split('/')
        if (!exists(baseId) || rest) return false
        return relation
      }).filter((r) => r)
      if (hasChanged || ressource.relations < nbRelations) {
        nbModif++
        $ressourceRepository.save(ressource, next)
      } else {
        next()
      }
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    // pas besoin de gérer ici le cache pour les personnes et les groupes, c'est dans le afterStore de leur entity
    let offset = 0
    let nbTotal = 0
    let nbModif = 0

    flow().seq(function () {
      // on compte
      EntityRessource.match('relations').count(this)
    }).seq(function (total) {
      offset = 0
      nbTotal = total
      updateLog(`${nbTotal} ressources à traiter`)
      grab(this)
    }).seq(function () {
      updateLog(`${nbTotal} ressources traitées, ${nbModif} modifiées`)
      done()
    }).catch(done)
  } // run
}
