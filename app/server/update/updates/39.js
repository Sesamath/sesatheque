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
  name: 'reindex toutes les ressources (pour avoir null sur les tableaux vides) avec groupes sans lowerCase',
  description: '',
  run: function run (next) {
    const EntityRessource = lassi.service('EntityRessource')
    const EntityGroupe = lassi.service('EntityGroupe')
    let nbRess = 0
    let nbRessGroup = 0
    let nbRessMod = 0
    // la liste des groupes indexés par lowerCase
    const knownGroupesByLowerCase = {}

    const getRealNames = (groupes, next) => {
      const newGroupes = []
      const warnings = []
      flow(groupes).seqEach(function (nom) {
        const lc = nom.toLowerCase()
        if (knownGroupesByLowerCase[lc]) return this(null, knownGroupesByLowerCase[lc])
        // le match sur lowerCase ou pas retourne la même chose
        EntityGroupe.match('nom').equals(nom).grabOne(this)
      }).seqEach(function (groupe, i) {
        if (typeof groupe === 'string') {
          newGroupes.push(groupe)
        } else if (groupe && groupe.nom) {
          newGroupes.push(groupe.nom)
          knownGroupesByLowerCase[groupe.nom.toLowerCase()] = groupe.nom
        } else {
          warnings.push(`Le groupe ${groupes[i]} n’existe plus`)
        }
      }).seq(function () {
        next(null, {newGroupes, warnings})
      }).catch(next)
    }

    flow().seq(function () {
      const onEach = (ressource, next) => {
        nbRess++
        if ((ressource.groupes && ressource.groupes.length) || (ressource.groupesAuteurs && ressource.groupesAuteurs.length)) nbRessGroup++
        let isMod = false
        flow().seq(function () {
          getRealNames(ressource.groupes, this)
        }).seq(function ({newGroupes, warnings}) {
          if (warnings.length) {
            updateLog.error(`WARNING sur la ressource ${ressource.oid} : ${warnings.join('\n  ')}`)
            isMod = true
          } else if (newGroupes.some((grp, i) => grp !== ressource.groupes[i])) {
            // pour contrôle de l'update
            updateLog(`Modifs groupes pour ${ressource.oid} :\n${ressource.groupes.join(' ')} =>\n${newGroupes.join(' ')}`)
            isMod = true
          }
          if (isMod) ressource.groupes = newGroupes
          // et on recommence avec les groupesAuteurs si y'en a
          if (!ressource.groupesAuteurs.length) return this(null, {newGroupes: [], warnings: []})
          getRealNames(ressource.groupesAuteurs, this)
        }).seq(function ({newGroupes: newGroupesAuteurs, warnings}) {
          let isGAmod = false
          if (warnings.length) {
            updateLog.error(`WARNING sur la ressource ${ressource.oid} : ${warnings.join('\n  ')}`)
            isGAmod = true
          } else if (newGroupesAuteurs.some((grp, i) => grp !== ressource.groupesAuteurs[i])) {
            isGAmod = true
          }
          if (isGAmod) {
            updateLog(`Modifs groupesAuteurs pour ${ressource.oid} :\n${ressource.groupesAuteurs.join(' ')} =>\n${newGroupesAuteurs.join(' ')}`)
            ressource.groupesAuteurs = newGroupesAuteurs
            isMod = true
          }
          if (ressource.groupes.length || ressource.groupesAuteurs.length) updateLog(`fin traitement ${ressource.oid} ${ressource.groupes.length} ${ressource.groupesAuteurs.length}`)
          if (isMod) ressource.store(next)
          else next()
        }).catch(next)
      } // onEach

      EntityRessource.match().forEachEntity(onEach, this)
    }).seq(function () {
      updateLog(`${nbRess} réindexées, ${nbRessMod} ressource modifiées (sur ${nbRessGroup} ressources avec groupes)`)
      next()
    }).catch(next)
  } // run
}
