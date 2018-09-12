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

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updateLog = require('an-log')('update' + updateNum)

module.exports = {
  name: 'met les paramètres mathgraph au nouveau format (avec content)',
  description: '',
  run: function run (next) {
    const EntityRessource = lassi.service('EntityRessource')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    let nbRess = 0
    let nbRessMod = 0
    let lastOid

    flow().seq(function () {
      const onEach = (ressource, next) => {
        lastOid = ressource.oid
        nbRess++
        if (ressource.parametres.content) return next()
        nbRessMod++
        ressource.parametres.content = {}
        Object.entries(ressource.parametres).forEach(([k, v]) => {
          if (['content', 'width', 'height', 'dys', 'open', 'newFig'].includes(k)) return
          // ça c'est un reste des versions java
          if (k === 'figure') ressource.parametres.content.fig = v
          else ressource.parametres.content[k] = v
          delete ressource.parametres[k]
        })
        $ressourceRepository.save(ressource, next)
      }
      EntityRessource.match('type').equals('mathgraph').sort('oid').forEachEntity(onEach, this)
    }).seq(function () {
      updateLog(`${nbRessMod} ressource Mathgraph modifiées (sur ${nbRess})`)
      next()
    }).catch(function (error) {
      console.error(`plantage dans l’update ${updateNum} avec la ressource ${lastOid}, ${nbRess} traitées, `)
      next(error)
    })
  } // run
}
