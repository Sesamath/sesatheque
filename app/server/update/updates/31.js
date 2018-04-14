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

const name = 'passage en https de ce qui peut l’être dans les coll_doc et pages externes'
const description = ''

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const config = require('../../server/config')
const updateLog = require('an-log')(`${config.application.name} update${updateNum}`)

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab (next) {
      flow().seq(function () {
        EntityRessource.match('type').in(['coll_doc', 'url']).grab({limit, skip}, this)
      }).seqEach(function (ressource) {
        nb++
        const url = ressource.parametres && (ressource.parametres.adresse || ressource.parametres.url)
        if (!url) return this()
        if (!/^http:\/\/(ressources|mep-outils|j3p)\.(dev)?sesamath.net/.test(url)) return this()
        const newAdresse = url.replace(/^http:/, 'https:')
        updateLog(`${ressource.oid} ${url} => ${newAdresse}`)
        if (ressource.parametres.adresse) ressource.parametres.adresse = newAdresse
        else ressource.parametres.url = newAdresse
        ressource.store(this)
      }).seq(function () {
        if (nb === skip + limit) {
          skip += limit
          grab(next)
        } else {
          next()
        }
      }).catch(next)
    }

    const EntityRessource = lassi.service('EntityRessource')
    let skip = 0
    let nb = 0
    const limit = 100
    grab(next)
  } // run
}
