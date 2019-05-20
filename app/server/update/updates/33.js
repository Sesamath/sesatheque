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

module.exports = {
  name: 'groupe.gestionnaires update',
  description: 'Remplace pid par oid dans les gestionnaires de groupe',
  run: function run (next) {
    const EntityGroupe = lassi.service('EntityGroupe')
    const $personneRepository = lassi.service('$personneRepository')
    // pour conserver les oid des pid connus
    const oidByPid = {}
    const deletedPids = new Set()

    const modGroupe = (groupe, nextGroupe) => {
      const oids = []
      const pidsUnknown = []
      let deleted = []
      let needSave = false

      const save = () => {
        groupe.gestionnaires = oids
        groupe.store(nextGroupe)
      }
      // on regarde s'il faut chercher en bdd
      groupe.gestionnaires.forEach(pid => {
        if (!pid.includes('/')) {
          // c'est déjà un oid
          oids.push(pid)
        } else {
          needSave = true
          if (oidByPid[pid]) oids.push(oidByPid[pid])
          else if (deletedPids.has(pid)) deleted.push(pid)
          else pidsUnknown.push(pid)
        }
      })

      if (pidsUnknown.length) {
        $personneRepository.loadByPids(pidsUnknown, (error, _personnes) => {
          if (error) return nextGroupe(error)
          const personnes = []
          const missing = []
          // récup des oids et tri des missing
          _personnes.forEach((p, index) => {
            if (p) {
              oidByPid[p.pid] = p.oid
              oids.push(p.oid)
              personnes.push(p)
            } else {
              missing.push(pidsUnknown[index])
            }
          })
          // on signale s'il en manque
          if (missing && missing.length) {
            // ennuyeux, un ou des pid disparu(s)
            deleted = deleted.concat(missing)
            log.dataError(`Le groupe ${groupe.oid} a des gestionnaires qui n'existent plus : ${deleted.join(', ')}`)
            // ce sera pas la peine de retourner les chercher
            missing.forEach(pid => deletedPids.add(pid))
          }
          groupe.gestionnaires = oids
          groupe.store(nextGroupe)
        })
      } else if (needSave) {
        save()
      } else {
        nextGroupe()
      }
    } // modGroupe

    EntityGroupe.match().forEachEntity(modGroupe, next)
  } // run
}
