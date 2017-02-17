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

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum

const name = 'conversion des personnes (ajout pid)'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      let currentTotal
      flow().seq(function () {
        EntityPersonne.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (personnes) {
        currentTotal = personnes.length
        this(null, personnes)

      // on itère
      }).seqEach(function (personne) {
        $cachePersonne.delete(personne.oid)
        personne.store(this)

      // log + suivants ou fin
      }).seq(function () {
        applog(updatePrefix, 'appliqué de', offset, 'à', offset + currentTotal - 1, 'sur', nbPersonnes)
        if (currentTotal === limit) {
          offset += limit
          setTimeout(grab, 0)
        } else {
          next()
        }
      }).catch(next)
    }
    // init
    const EntityPersonne = lassi.service('EntityPersonne')
    const $cachePersonne = lassi.service('$cachePersonne')
    let offset = 0
    let nbPersonnes = 0

    // on compte et on y va
    EntityPersonne.match().count(function (error, total) {
      if (error) return next(error)
      applog(updatePrefix, name, 'avec', total, 'personnes à traiter')
      if (total === 0) return next()
      nbPersonnes = total
      grab()
    })
  } // run
}
