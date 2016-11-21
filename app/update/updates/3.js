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

var name = 'check de tous les alias pour normalisation'
var description = 'on vire toute url absolue pour ne garder que des baseId'

var limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      EntityAlias.match('oid').greaterThan(0).grab(limit, offset, function (error, aliases) {
        if (error) return next(error)
        flow(aliases).seqEach(function (alias) {
          if (alias.base) {
            if (alias.base.indexOf('bibliotheque') !== -1) {
              alias.baseIdOriginal = 'sesabibli'
            } else if (alias.base.indexOf('commun') !== -1) {
              alias.baseIdOriginal = 'sesacommun'
            }
            delete alias.base
          } else if (!alias.baseIdOriginal) {
            log.error('alias de base inconnue ' + alias.base)
            alias.baseIdOriginal = 'unknown'
          }
          log.debug('nouvel alias', alias)
          alias.store(this)
        }).seq(function () {
          if (aliases.length === limit) {
            offset += limit
            grab()
          } else {
            this()
          }
        }).done(next)
      })
    }
    var EntityAlias = lassi.service('EntityAlias')
    var offset = 0
    grab()
  } // run
}
