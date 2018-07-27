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
const uuid = require('an-uuid')

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updateLog = require('an-log')('update' + updateNum)
const {application: {baseId}} = require('../../config')

module.exports = {
  name: 'nettoie les doublons de rid, cle, pid, réindexe tout',
  description: '',
  run: function run (next) {
    const EntityGroupe = lassi.service('EntityGroupe')
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    const $groupeRepository = lassi.service('$groupeRepository')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    // on utilise le cli de lassi pour reindexAll
    const $entitiesCli = require('lassi/source/services/entities-cli.js')
    const reindexAll = $entitiesCli().commands().reindexAll

    let nbDoublonsPid = 0
    let nbDoublonsRid = 0
    let nbEmptyRid = 0
    let nbDoublonsCle = 0
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
      nbDoublonsPid++
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
      if (!nbDoublonsPid) updateLog('Il n’y avait aucun pid en doublon')

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
      nbDoublonsRid++
      const {_id: {rid}} = result
      flow().seq(function () {
        updateLog.error(`rid ${rid} en ${result.count} exemplaires`)
        EntityRessource.match('rid').equals(rid).grab(this)
      }).seqEach(function (ressource) {
        const rid = `${baseId}/${ressource.oid}`
        if (rid === ressource.rid) return this()
        updateLog(`rid invalide pour ${ressource.oid}, ${ressource.rid} => ${rid}`)
        ressource.rid = rid
        $ressourceRepository.save(ressource, this)
      }).done(this)
    }).seq(function () {
      if (!nbDoublonsRid) updateLog('Il n’y avait aucun rid en doublon')

      // on passe aux rid vides
      EntityRessource.match('rid').in(['', 'undefined', 'null']).grab(this)
    }).seqEach(function (ressource) {
      nbEmptyRid++
      ressource.rid = `${baseId}/${ressource.oid}`
      $ressourceRepository.save(ressource, this)
    }).seq(function () {
      // rid null, devrait pas y en avoir mais…
      EntityRessource.match('rid').isNull().grab(this)
    }).seqEach(function (ressource) {
      nbEmptyRid++
      ressource.rid = `${baseId}/${ressource.oid}`
      $ressourceRepository.save(ressource, this)
    }).seq(function () {
      if (nbEmptyRid) updateLog(`${nbEmptyRid} rid vides corrigés`)
      else updateLog('Il n’y avait aucun rid vide')

      // on passe aux clés, via updateMany nettement plus efficace
      // on vire les clés vides (pour passer en index unique on veut null et pas chaîne vide)
      // https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/
      // http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#updateMany
      const filter = {cle: ''}
      const update = {$unset: {cle: '', '_data.cle': ''}}
      EntityRessource.getCollection().updateMany(filter, update, {}, this)
    }).seq(function () {
      // on vire les clés des ressources publiques
      const filter = {publie: true, restriction: 0}
      const update = {$unset: {cle: '', '_data.cle': ''}}
      EntityRessource.getCollection().updateMany(filter, update, {}, this)
    }).seq(function () {
      // on passe aux doublons de clés (pb lors du fork où on a pas créée de nouvelle clé)
      EntityRessource.getCollection().aggregate([
        {
          $match: {cle: {$ne: null}}
        },
        {
          $group: {
            _id: {cle: '$cle'},
            count: {$sum: 1}
          }
        }, {
          $match: {count: {$gt: 1}}
        }
      ]).toArray(this)
    }).seqEach(function (result) {
      const {_id: {cle}} = result
      let nieme = 0
      flow().seq(function () {
        updateLog.error(`cle ${cle} en ${result.count} exemplaires`)
        EntityRessource.match('cle').equals(cle).grab(this)
      }).seqEach(function (ressource) {
        // on change pas le 1er
        nieme++
        if (nieme === 1) return this()
        nbDoublonsCle++
        const cle = uuid()
        updateLog(`cle en doublon pour ${ressource.oid}, ${ressource.cle} => ${cle}`)
        ressource.cle = cle
        $ressourceRepository.save(ressource, this)
      }).done(this)
    }).seq(function () {
      if (nbDoublonsCle) updateLog(`${nbDoublonsCle} doublons de clé modifiés`)
      else updateLog('Il n’y avait aucune cle en doublon')

      updateLog('Réindexation de toute les entities')
      this(null, ['EntityArchive', 'EntityExternalRef', 'EntityGroupe', 'EntityPersonne', 'EntityRessource', 'EntityUpdate'])
    }).seqEach(function (entityName) {
      reindexAll(entityName, this)
    }).seq(function () {
      updateLog('fin des réindexations')
      next()
    }).catch(next)
  } // run
}
