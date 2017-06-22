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

const name = 'Met à jour les gestionnaires de groupe en mettant un pid partout (pour ceux qui auraient encore un oid)'
const description = ''

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes
    function cleanGestionnaires (groupe, next) {
      const newGestionnaires = []
      flow(groupe.gestionnaires).seqEach(function (pid) {
        const nextGestionnaire = this
        $personneRepository.load(pid, function (error, personne) {
          if (error) return nextGestionnaire(error)
          if (personne) newGestionnaires.push(personne.pid)
          else log.dataError(`Le gestionnaire ${pid} n’existe pas ou plus`)
          nextGestionnaire()
        })
      }).seq(function () {
        if (!newGestionnaires.length) {
          const msg = `Le groupe ${groupe.nom} a perdu tous ses gestionnaires (on avait ${groupe.gestionnaires.join(', ')}), on le supprime`
          log.dataError(msg)
          updateLog(msg)
          $groupeRepository.delete(groupe.nom, this)
        } else if (newGestionnaires.some((pid, i) => pid !== groupe.gestionnaires[i])) {
          updateLog(`groupe ${groupe.nom} modifié : ${groupe.gestionnaires.join(', ')} => ${newGestionnaires.join(', ')}`)
          groupe.gestionnaires = newGestionnaires
          $groupeRepository.save(groupe, this)
        } else {
          next()
        }
      }).done(next)
    }

    // init
    const EntityGroupe = lassi.service('EntityGroupe')
    const $groupeRepository = lassi.service('$groupeRepository')
    const $personneRepository = lassi.service('$personneRepository')

    updateLog(name)
    flow().seq(function () {
      // on traite les groupes
      EntityGroupe.match().sort('oid').count(this)
    }).seq(function (total) {
      updateLog(`${total} groupes à vérifier`)
      if (total) EntityGroupe.match().sort('oid').grab(this)
      else done()
    }).seqEach(function (groupe) {
      cleanGestionnaires(groupe, this)
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
