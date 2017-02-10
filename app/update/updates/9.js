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

var flow = require('an-flow')

var name = 'passe publie à true pour toutes les ressources d’origine labomepPERSOS'
var description = ''

var limit = 100

var EntityRessource = lassi.service('EntityRessource')
const applog = require('an-log')(lassi.settings.application.name)

// pour voir le nb de ressources par origine
// SELECT _string as origine, count(*) as nb  FROM ressource_index WHERE name = 'origine' group by _string

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      applog('update 9', name, offset, 'à', offset + limit - 1)
      EntityRessource.match('origine').equals('labomepPERSOS').sort('oid').grab(limit, offset, function (error, ressources) {
        if (error) return next(error)
        // log.debug('ressources ' + ressources.map((r) => r.oid).join(' '))
        flow(ressources).seqEach(function (ressource) {
          if (!ressource.publie) {
            ressource.publie = true
            ressource.store(this)
          } else {
            this()
          }
        }).seq(function () {
          if (ressources.length === limit) {
            offset += limit
            setTimeout(grab, 0)
          } else {
            this()
          }
        }).done(next)
      })
    }
    // init
    var offset = 0
    // go
    grab()
  } // run
}
