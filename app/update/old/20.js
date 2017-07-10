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
const config = require('../../config')

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)

const name = 'Vérification que tous les groupes sont en minuscules'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes
    function grabGroupes (next) {
      let currentTotal
      flow().seq(function () {
        EntityGroupe.match().grab(limit, offset, this)

        // on note le total
      }).seq(function (groupes) {
        currentTotal = groupes.length
        this(null, groupes)

        // on itère
      }).seqEach(function (groupe) {
        if (groupe.nom !== groupe.nom.toLowerCase()) {
          badGroupes.add(groupe.nom)
          groupe.nom = groupe.nom.toLowerCase()
          $groupeRepository.save(groupe, this)
        } else {
          this()
        }

        // log + suivants ou fin
      }).seq(function (pids) {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} groupes sur ${nb}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabGroupes, next)
        } else {
          next()
        }
      }).catch(next)
    }

    function cleanEntityField (entity, field, saveFn, next) {
      flow().seq(function () {
        entity.match(field).in(badGroupesArray).count(this)
      }).seq(function (total) {
        updateLog(`${total} ${entity.name} à traiter (champ ${field})`)
        if (total) entity.match(field).in(badGroupesArray).grab(this)
        else next()
      }).seqEach(function (entityInstance) {
        entityInstance[ field ] = entityInstance[ field ].map(groupeNom => groupeNom.toLowerCase())
        saveFn(entityInstance, this)
      }).done(next)
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityGroupe = lassi.service('EntityGroupe')
    const $groupeRepository = lassi.service('$groupeRepository')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    let offset = 0
    let nb = 0
    // pour se simplifier la vie et éviter de passer un argument à grab
    // stockage des infos d'avancement
    let badGroupes = new Set()
    let badGroupesArray

    updateLog(name)
    flow().seq(function () {
      // on traite les groupes
      EntityGroupe.match().sort('oid').count(this)
    }).seq(function (total) {
      updateLog(`${total} groupes à vérifier`)
      nb = total
      if (total) grabGroupes(this)
      else done()
    }).seq(function () {
      if (!badGroupes.size) {
        updateLog('Tous les groupes étaient en bas de casse, rien à modifier')
        return done()
      }
      badGroupesArray = Array.from(badGroupes)
      // on modifie toutes les ressources ayant un groupe modifié dedans
      cleanEntityField(EntityRessource, 'groupes', $ressourceRepository.save, this)
    }).seq(function () {
      cleanEntityField(EntityRessource, 'groupesAuteur', $ressourceRepository.save, this)
    }).seq(function () {
      // les personnes
      cleanEntityField(EntityPersonne, 'groupesMembre', $groupeRepository.save, this)
    }).seq(function () {
      cleanEntityField(EntityPersonne, 'groupesSuivis', $groupeRepository.save, this)
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
