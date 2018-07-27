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
const {getNormalizedName} = require('../../lib/normalize')

module.exports = {
  name: 'fusionne les groupes de même nom',
  description: '',
  run: function run (next) {
    const EntityGroupe = lassi.service('EntityGroupe')
    const $groupeRepository = lassi.service('$groupeRepository')

    const dedup = (ar1, ar2) => Array.from(new Set(ar1.concat(ar2)))

    const byNom = {}
    const toDel = []
    const toSave = new Set()

    flow().seq(function () {
      const onEach = (groupe, next) => {
        const {gestionnaires, nom, oid} = groupe
        const n = getNormalizedName(nom)
        if (byNom[n]) {
          updateLog(`${n} en double (${nom})`)
          // c'est un doublon, faut fusionner les gestionnaires
          const old = byNom[n]
          old.gestionnaires = dedup(old.gestionnaires, gestionnaires)
          toDel.push(oid)
          toSave.add(n)
        } else {
          byNom[n] = groupe
        }
        next()
      }
      EntityGroupe.match().forEachEntity(onEach, this)
    }).set(Array.from(toSave)).seqEach(function (nom) {
      updateLog(`sauvegarde de ${byNom[nom].nom} (gestionnaires fusionnés)`)
      $groupeRepository.save(byNom[nom], this)
    }).seq(function () {
      if (toDel.length) EntityGroupe.match('oid').in(toDel).purge(this)
      else this()
    }).seq(function () {
      if (toDel.length) updateLog(`${toDel.length} groupes en double supprimés`)
      else updateLog('Il n’y avait pas de groupe en double')
      next()
    }).catch(next)
  } // run
}
