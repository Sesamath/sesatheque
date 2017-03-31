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
const sesatheques = require('sesatheque-client/src/sesatheques')
// const config = require('../../config')
// const myBaseId = config.application.baseId

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum
const updateLog = (message) => applog(updatePrefix, message)
// const updateLogErr = (message) => applog.error(updatePrefix, message)

const name = 'normalisation du contenu des sequenceModele'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes

    function grab (next) {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match('type').equals('sequenceModele').sort('oid').grab(limit, offset, this)

        // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

        // on itère
      }).seqEach(function (ressource) {
        const sousSequences = ressource.parametres && ressource.parametres.sousSequences
        if (sousSequences && sousSequences.length) {
          ressource.parametres.sousSequences = ressource.parametres.sousSequences.map(ssseq => {
            if (ssseq.serie) {
              ssseq.serie = ssseq.serie.map(exo => {
                if (exo.rid) return cleanItem(exo)
                exo.rid = getRid(exo)
                return cleanItem(exo)
              })
            }
          })
          ressource.store(this)
        } else {
          this()
        }

        // log + suivants ou fin
      }).seq(function (ressourcesModifiees) {
        ressourcesModifiees.forEach((ressource) => $cacheRessource.delete(ressource.oid))
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grab, next)
        } else {
          next()
        }
      }).catch(next)
    }

    function getRid (item) {
      if (item.rid) return item.rid
      if (item.baseId && item.id) {
        const rid = item.baseId + '/' + item.id
        delete item.baseId
        delete item.id
        return rid
      }
      if (item.id && item.displayUrl) {
        const rid = sesatheques.getBaseIdFromUrlQcq() + '/' + item.id
        delete item.baseId
        delete item.id
        return rid
      }
      return console.error(new Error('impossible de retrouver un rid pour cet item'), item)
    }

    function cleanItem (item) {
      if (item.id) delete item.id
      if (item.baseId) delete item.baseId
      if (item.baseUrl) delete item.baseUrl
      return item
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')
    let offset = 0
    let nbRessources = 0

    updateLog(name)
    flow().seq(function () {
      // on compte les sequenceModele
      EntityRessource.match('type').equals('sequenceModele').sort('oid').count(this)
    }).seq(function (total) {
      updateLog(`${total} sequenceModele à traiter`)
      nbRessources = total
      grab(this)
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
