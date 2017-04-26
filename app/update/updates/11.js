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

const name = 'conversion des EntityAlias en EntityRessource'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      let currentTotal
      // on compte
      flow().seq(function () {
        const nextSeq = this
        EntityAlias.match().count(function (error, total) {
          if (error) return next(error)
          applog('update 11', name, 'avec', total, 'alias à traiter')
          if (total === 0) return next()
          nextSeq()
        })

      // on va les chercher
      }).seq(function () {
        EntityAlias.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (aliases) {
        currentTotal = aliases.length
        this(null, aliases)

      // on itère
      }).seqEach(function (alias) {
        if (alias.ref) {
          const baseId = alias.baseIdOriginal || alias.baseId || myBaseId
          if (baseId === myBaseId) {
            // en février 2017 c'est louche…
            log.dataError('alias bizarre qui référence une ressource sur cette sésathèque', alias)
          }
          const ressource = {
            aliasOf: baseId + '/' + alias.ref
          }
          // on copie ces propriétés
          ;['titre', 'type', 'resume', 'description', 'commentaires', 'categories', 'public', 'cle'].forEach(k => {
            ressource[k] = alias[k]
          })
          EntityRessource.create(ressource).store(this)
        } else {
          log.dataError(`alias ${alias.oid} sans ref`, alias)
          this()
        }

      // log + suivants ou fin
      }).seq(function () {
        applog('update 11', 'appliqué de', offset, 'à', offset + currentTotal - 1)
        if (currentTotal === limit) {
          offset += limit
          setTimeout(grab, 0)
        } else {
          next()
        }
      }).catch(next)
    }
    // init
    let offset = 0
    const EntityAlias = lassi.service('EntityAlias')
    const EntityRessource = lassi.service('EntityRessource')
    // go
    grab()
  } // run
}
