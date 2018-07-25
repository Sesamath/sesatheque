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
  name: 'nettoie les rid et pid en doublon',
  description: '',
  run: function run (next) {
    const EntityGroupe = lassi.service('EntityGroupe')
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    const $groupeRepository = lassi.service('$groupeRepository')

    flow().seq(function () {
      EntityPersonne.getCollection().aggregate([
        {
          $group: {
            _id: {pid: '$pid'},
            count: {$sum: 1}
          }
        }, {
          $match: {count: {$gt: 1}}
        }
      ]).toArray(this)
    }).seqEach(function (result) {
      const nextPersonne = this
      const {_id: {pid}} = result
      let oidToKeep
      let oidsToDel
      flow().seq(function () {
        EntityPersonne.match('pid').equals(pid).grab(this)
      }).seq(function (personnes) {
        updateLog(`pid ${pid} en ${personnes.length} exemplaires (${personnes.map(r => r.oid).join(', ')})`)
        const {oid} = personnes.pop()
        oidToKeep = oid
        oidsToDel = personnes.map(p => p.oid)
        EntityPersonne.match('oid').in(oidsToDel).purge(this)
      }).seq(function () {
        // groupe.gestionnaires est le seul champ à contenir des oids de personne
        EntityGroupe.match('gestionnaires').in(oidsToDel).grab(this)
      }).seqEach(function (groupe) {
        groupe.gestionnaires = groupe.gestionnaires.filter(oid => !oidsToDel.includes(oid))
        if (!groupe.gestionnaires.includes(oidToKeep)) groupe.gestionnaires.push(oidToKeep)
        $groupeRepository.save(groupe, this)
      }).done(nextPersonne)
    }).seq(function () {
      // on peut passer aux ressources
      EntityRessource.getCollection().aggregate([
        {
          $group: {
            _id: {rid: '$rid'},
            count: {$sum: 1}
          }
        }, {
          $match: {count: {$gt: 1}}
        }
      ]).toArray(this)
    }).seqEach(function (result) {
      const nextRessource = this
      const {_id: {rid}} = result
      let oidsToDel
      flow().seq(function () {
        EntityRessource.match('rid').equals(rid).grab(this)
      }).seq(function (ressources) {
        updateLog(`rid ${rid} en ${ressources.length} exemplaires (${ressources.map(r => r.oid).join(', ')})`)
        // on garde la dernière (on mémorise pas car les oid de ressource
        // ne sont jamais utilisés comme ref externe, c'est toujours des rid)
        ressources.pop()
        oidsToDel = ressources.map(p => p.oid)
        EntityRessource.match('oid').in(oidsToDel).purge(this)
      }).done(nextRessource)
    }).seq(function () {
      updateLog('doublons pid & rid supprimés')
      next()
    }).catch(next)
  } // run
}
