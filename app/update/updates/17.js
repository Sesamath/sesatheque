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
const applog = require('an-log')(lassi.settings.application.name)
const config = require('../../config')
const myBaseId = config.application.baseId

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum
const updateLog = (message) => applog(updatePrefix, message)
const updateLogErr = (message) => applog.error(updatePrefix, message)

const name = 'normalisation des auteurs, contributeurs & co avec des pid (tous en origine/idOrigine)'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes

    /**
     * 1re passe pour récupérer toutes les personnes et fixer leur pid en origine/idOrigine
     */
    function grabPersonnes (next) {
      let currentTotal
      flow().seq(function () {
        EntityPersonne.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (personnes) {
        currentTotal = personnes.length
        this(null, personnes)

      // on itère
      }).seqEach(function (personne) {
        function checkDoublon () {
          const pid = personne.pid
          if (oidsByPid[pid]) {
            if (!doublons[pid]) doublons[pid] = []
            doublons[pid].push(personne.oid)
          }
          oidsByPid[pid] = personne.oid
          nextPersonne()
        }

        const nextPersonne = this
        if (personne.origine && personne.idOrigine) {
          const pid = personne.origine + '/' + personne.idOrigine
          pidsByOid[personne.oid] = pid
          pidsTranslated[myBaseId + '/' + personne.oid] = pid
          if (personne.pid === pid) {
            checkDoublon()
          } else {
            pidsTranslated[personne.pid] = pid
            personne.pid = pid
            personne.store(function (error) {
              if (error) return nextPersonne(error)
              checkDoublon()
            })
          }
        } else {
          if (personne.pid && personne.pid.indexOf('/') !== -1) pidsByOid[personne.oid] = personne.pid
          log.errorData('personne sans origine/idOrigine', personne)
          updateLogErr(`personne ${personne.oid} sans origine/idOrigine avec pid ${personne.pid}`)
          checkDoublon()
        }
      }).seq(function () {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbPersonnes}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabPersonnes, next)
        } else {
          next()
        }
      }).catch(next)
    }

    function grabRessources (next) {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match('auteurs').sort('oid').grab(limit, offset, this)

        // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

        // on itère
      }).seqEach(function (ressource) {
        let needSave = false
        // auteurs
        ressource.auteurs = ressource.auteurs.map(pid => {
          const newPid = cleanPid(pid)
          if (newPid === pid) return pid
          needSave = true
          if (newPid) return newPid
          // si on est toujours là, on a pas trouvé le bon pid, ennuyeux…
          log.errorData(`impossible de trouver le bon pid pour l’auteur ${pid} de la ressource ${ressource.oid}`)
          if (!ressource.warnings) ressource.warnings = []
          ressource.warnings.push(`L’auteur ${pid} n’existe plus`)
          updateLogErr(`L’auteur ${pid} mentionné dans la ressource ${ressource.oid} n’existe plus`)
        }).filter(pid => pid)
        // avertissement sup en cas de pb
        if (!ressource.auteurs.length) updateLogErr(`La ressource ${ressource.oid} n'a plus d'auteurs`)

        // auteursParents
        if (ressource.auteursParents && ressource.auteursParents.length) {
          ressource.auteursParents = ressource.auteursParents.map(pid => {
            const newPid = cleanPid(pid)
            if (newPid === pid) return pid
            needSave = true
            if (newPid) return newPid
            // si on est toujours là, on a pas trouvé le bon pid, ennuyeux…
            log.errorData(`impossible de trouver le bon pid pour l’auteur parent ${pid} de la ressource ${ressource.oid}`)
            if (!ressource.warnings) ressource.warnings = []
            ressource.warnings.push(`L’auteur parent ${pid} n’existe plus`)
            updateLogErr(`L’auteur parent ${pid} mentionné dans la ressource ${ressource.oid} n’existe plus`)
          }).filter(pid => pid)
        }

        // contributeurs
        if (ressource.contributeurs && ressource.contributeurs.length) {
          ressource.contributeurs = ressource.contributeurs.map(pid => {
            const newPid = cleanPid(pid)
            if (newPid === pid) return pid
            needSave = true
            if (newPid) return newPid
            // si on est toujours là, on a pas trouvé le bon pid, ennuyeux…
            log.errorData(`impossible de trouver le bon pid pour le contributeur ${pid} de la ressource ${ressource.oid}`)
            if (!ressource.warnings) ressource.warnings = []
            ressource.warnings.push(`Le contributeur ${pid} n’existe plus`)
            updateLogErr(`Le contributeur ${pid} mentionné dans la ressource ${ressource.oid} n’existe plus`)
          }).filter(pid => pid)
        }
        // màj
        if (needSave) ressource.store(this)
        else this()

        // log + suivants ou fin
      }).seq(function (ressourcesModifiees) {
        ressourcesModifiees.forEach((ressource) => $cacheRessource.delete(ressource.oid))
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabRessources, next)
        } else {
          next()
        }
      }).catch(next)
    }

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
        let needSave = false
        if (!groupe.gestionnaires) groupe.gestionnaires = []
        if (groupe.gestionnaires.length) {
          groupe.gestionnaires = groupe.gestionnaires.map(pid => {
            const newPid = cleanPid(pid)
            if (newPid === pid) return pid
            needSave = true
            if (newPid) return newPid
            // si on est toujours là, on a pas trouvé le bon pid, ennuyeux…
            log.errorData(`impossible de trouver le bon pid pour l’auteur ${pid} du groupe ${groupe.nom}`)
            updateLog(`impossible de trouver le bon pid pour l’auteur ${pid} du groupe ${groupe.nom}`)
          }).filter(pid => pid)
          if (!groupe.gestionnaires.length) {
            log.errorData(`Le groupe “${groupe.nom}” n’a plus de gestionnaire`, groupe)
            updateLogErr(`Le groupe “${groupe.nom}” n’a plus de gestionnaire`)
          }
        } else {
          log.errorData(`Le groupe “${groupe.nom}” n’a pas de gestionnaire`)
          updateLogErr(`Le groupe “${groupe.nom}” n’a pas de gestionnaire`)
        }
        if (needSave) groupe.store(this)
        else this()

        // log + suivants ou fin
      }).seq(function () {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbGroupes}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabGroupes, next)
        } else {
          next()
        }
      }).catch(next)
    }

    function cleanPid (pid) {
      if (oidsByPid[pid]) return pid // le pid est déjà correct
      if (pidsTranslated[pid]) return pidsTranslated[pid] // le pid a été translaté
      if (pidsByOid[pid]) return pidsByOid[pid] // le pid était un oid dont on a le bon pid
      // sinon on en sait rien…
    }

    // init
    const EntityGroupe = lassi.service('EntityGroupe')
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')
    // pas besoin de gérer ici le cache pour les personnes et les groupes, c'est dans le afterStore de leur entity
    let offset = 0
    let nbPersonnes = 0
    let nbRessources = 0
    let nbGroupes = 0
    // pour mémoriser oid => pid
    const pidsByOid = {}
    // pour mémoriser des changement de pid de baseId/oid on origine/idOrigine
    const pidsTranslated = {}
    // tous les pids "corrects", pour vérifier les doublons au passage
    const oidsByPid = {}
    const doublons = {}

    updateLog(name)
    flow().seq(function () {
      // on compte les personnes
      EntityPersonne.match().count(this)
    }).seq(function (total) {
      updateLog(`${total} personnes à traiter`)
      nbPersonnes = total
      grabPersonnes(this)
    }).seq(function () {
      // on passe en toutes les ressources avec un auteur
      EntityRessource.match('auteurs').count(this)
    }).seq(function (total) {
      nbRessources = total
      updateLog(`${total} ressources à traiter`)
      grabRessources(this)
    }).seq(function () {
      // et tous les groupes
      EntityGroupe.match().count(this)
    }).seq(function (total) {
      nbGroupes = total
      updateLog(`${total} groupes à traiter`)
      grabGroupes(this)
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
