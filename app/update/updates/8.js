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

var name = 'correction des relations en double'
var description = ''

var limit = 100

var EntityRessource = lassi.service('EntityRessource')
var $ressourceRepository = lassi.service('$ressourceRepository')
const applog = require('an-log')(lassi.settings.application.name)

function cleanRelations (ressource) {
  // on dédoublonne avec un map dont les clés sont la concaténation predicat-cible
  var relations = new Map()
  ressource.relations.forEach(function (relation) {
    if (Array.isArray(relation) && relation.length === 2) relations.set('' + relation[0] + relation[1], relation)
  })
  // on ne parse le Map que s'il y avait des doublons
  if (relations.size < ressource.relations.length) {
    ressource.relations = Array.from(relations.values())
    log.debug(ressource.oid + ' cleaned')
    return true
  }
  return false
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      applog('update 8', name, offset, 'à', offset + limit)
      // ce truc étant multiple, on récupère 3× la même ressource si elle a 3 relations
      var options = {distinct: true}
      EntityRessource.match('relations').sort('oid').grab(limit, offset, options, function (error, ressources) {
        if (error) return next(error)
        // log.debug('ressources ' + ressources.map((r) => r.oid).join(' '))
        var currentSubOffset = 0
        var current
        flow(ressources).seqEach(function (ressource) {
          currentSubOffset++
          current = ressource.oid
          if (!!ressource.origine !== !!ressource.idOrigine) {
            // y'a un pb on a un seul des deux :-/
            // le save va planter (il est maintenant plus chatouilleux)
            log.error('ressource avec seulement origine ou idOrigine', ressource)
            return this()
          }
          if (ressource.relations.length > 1 && cleanRelations(ressource)) $ressourceRepository.save(ressource, this)
          else if (ressource.relations.length > 0 && ressource.relations.find((r) => typeof r[1] === 'string' && r[1].indexOf('/') !== -1)) $ressourceRepository.save(ressource, this)
          else this()
        }).seq(function () {
          if (ressources.length === limit) {
            offset += limit
            // on laisse refroidir un peu le disque de la bdd,
            // mais pas aussi longtemps que le fût du canon car on a pas que ça à faire
            setTimeout(grab, 100)
          } else {
            this()
          }
        }).seq(next).catch(function (error) {
          log.error(error)
          applog(`plantage sur la ressource ${current}, on continue quand même`)
          // mais on continue
          offset += currentSubOffset
          grab()
        })
      })
    }
    // init
    var offset = 0
    // go
    grab()
  } // run
}
