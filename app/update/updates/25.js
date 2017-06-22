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
const myBaseId = config.application.baseId

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)
const updateLogErr = updateLog.error
const logBoth = (message, obj) => {
  updateLogErr(message)
  log.dataError(message, obj)
}

const name = 'normalisation des pids (baseId normées)'
const description = ''

const limit = 100

const translate = {
  'new.labomep.net': 'labomep',
  'labomep.sesamath.net': 'labomep',
  'labomep.devsesamath.net': 'labomepDev',
  'labomep.local': 'labomepLocal',
  'labomep2dev': 'labomepDev' // une erreur mise en conf des bibli de dev à un moment…
}
const knownBaseIds = new Set()
knownBaseIds.add('sesasso')
knownBaseIds.add('labomep')
knownBaseIds.add('labomepDev')
knownBaseIds.add('labomepLocal')
knownBaseIds.add('labomepLocal3002')

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes

    /**
     * 1re passe pour récupérer toutes les personnes, fixer leur pid et mémoriser les modifs
     */
    function grabPersonnes (next) {
      let currentTotal
      let nbModifs = 0
      flow().seq(function () {
        EntityPersonne.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (personnes) {
        currentTotal = personnes.length
        this(null, personnes)

      // on itère
      }).seqEach(function (personne) {
        const nextPersonne = this
        if (!personne.pid) {
          logBoth(`personne ${personne.oid} sans pid`, personne)
          return nextPersonne()
        }
        if (typeof personne.pid !== 'string') {
          logBoth(`personne ${personne.oid} avec pid ${typeof personne.pid}`, personne)
          return nextPersonne()
        }
        if (personne.pid.indexOf('/') === -1) {
          logBoth(`personne ${personne.oid} avec pid invalide ${personne.pid}`, personne)
          return nextPersonne()
        }
        const [domain, oid] = personne.pid.split('/')
        // les pids déjà OK
        if (knownBaseIds.has(domain)) return nextPersonne()
        // ceux qu'il faut transformer
        if (translate[domain]) {
          nbModifs++
          const newPid = translate[domain] + '/' + oid
          if (translated.has(personne.pid)) {
            logBoth(`personne ${oid} avec pid ${personne.pid} en double (pid déjà rencontré)`)
            doublons.add(personne.pid)
          }
          translated.set(personne.pid, newPid)
          personne.pid = newPid
          $personneRepository.save(personne, nextPersonne)
        } else if (domain === myBaseId) {
          if (oid === personne.oid) orphans.set(oid, personne.pid)
          else toReplace.set(personne.oid, oid)
          nextPersonne()
          // faut aller chercher l'autre
        } else {
          logBoth(`personne ${oid} sans pid d’origine connu (${personne.pid})`, personne)
          nextPersonne()
        }
      }).seq(function () {
        updateLog(`parsing des personnes de ${offset} à ${offset + currentTotal - 1} sur ${nbPersonnes} terminé (${nbModifs} modifs)`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabPersonnes, next)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * Charge toutes les ressources ayant un rapport avec les pids modifiés
     */
    function grabRessources (next) {
      const pids = Array.from(translated.keys())
      if (pids.length) {
        updateLog(`${pids.length} pids modifiés, parsing des ressources`)
      } else {
        updateLog('Aucun pid à corriger sur les ressources…')
        return next()
      }
      let nb = 0
      flow(pids).seqEach(function (pid) {
        const nextPid = this
        EntityRessource.match('iPids').equals(pid).grab(function (error, ressources) {
          if (error) {
            logBoth(error)
            return nextPid()
          }
          flow(ressources).seqEach(function (ressource) {
            nb++
            cleanRessource(ressource, this)
          }).done(nextPid)
        })
      }).seq(function () {
        updateLog(`${nb} ressources mises à jour`)
        next()
      }).catch(next)
    }

    function cleanRessource (ressource, next) {
      flow().seq(function () {
        const cleanPid = pid => translated.get(pid) || pid
        ressource.auteurs = ressource.auteurs.map(cleanPid)
        if (ressource.contributeurs) ressource.contributeurs = ressource.contributeurs.map(cleanPid)
        if (ressource.auteursParents) ressource.auteursParents = ressource.auteursParents.map(cleanPid)
        $ressourceRepository.save(ressource, this)
      }).done(next)
    }

    function grabGroupes (next) {
      const pids = Array.from(translated.keys())
      if (!pids.length) {
        updateLog('Aucun pid à corriger sur les groupes…')
        return next()
      }
      let nbGroupes = 0
      flow(pids).seqEach(function (pid) {
        const nextPid = this
        EntityGroupe.match('gestionnaires').equals(pid).grab(function (error, groupes) {
          if (error) return nextPid(error)
          if (!groupes || !groupes.length) return nextPid()
          flow(groupes).seqEach(function (groupe) {
            groupe.gestionnaires = groupe.gestionnaires.map(pid => translated.get(pid) || pid)
            nbGroupes++
            $groupeRepository.save(groupe, this)
          }).done(nextPid)
        })
      }).seq(function () {
        updateLog(`${nbGroupes} groupes mis à jour`)
        next()
      }).catch(next)
    }

    /**
     * parcours toReplace pour charger la cible et si c'est un pid valide l'ajouter à translated
     * (sinon ajouter l'oid source à orphans)
     * @private
     * @param next
     */
    function replacePids (next) {
      function moveToOrphan (oid) {
        orphans.set(oid, `${myBaseId}/${oid}`)
        toReplace.delete(oid)
      }
      // on regarde si y'a pas des destinations déjà connues pour être introuvables
      toReplace.forEach((oidDst, oidSrc) => {
        if (orphans.has(oidDst)) moveToOrphan(oidSrc)
      })
      const toCheck = Array.from(toReplace.keys())
      let personneIndex = 0
      flow(toCheck).seqEach(function (oidSrc) {
        const oidDst = toReplace[oidSrc]
        $personneRepository.load(oidDst, this)
      }).seqEach(function (personne) {
        const oidSrc = toCheck[personneIndex]
        personneIndex++
        const pidSrc = `${myBaseId}/${oidSrc}`
        if (personne) {
          // on regarde s'il est lui-même transformé
          if (translated.has(personne.pid)) {
            translated.set(pidSrc, translated[personne.pid])
            toSuppr.add(oidSrc)
          } else {
            const [baseId, , other] = personne.pid.split('/')
            if (other) {
              updateLogErr(`personne ${personne.oid} avec un pid incorrect ${personne.pid}`)
              moveToOrphan(oidSrc)
            } else if (knownBaseIds.has(baseId)) {
              translated.set(pidSrc, personne.pid)
              toSuppr.add(oidSrc)
            } else {
              moveToOrphan(oidSrc)
            }
          }
        } else {
          moveToOrphan(oidSrc)
        }
        this()
      }).done(next)
    }

    function cleanObsolete (next) {
      flow(Array.from(toSuppr)).seqEach(function (oidToSuppr) {
        // faudrait vérifier qu'il n'y a plus de ressources avec cet oid
        // mais faut remonter au pid et faire un paquet de requête, on va rester optimiste
        // en supposant que grabGroupes a bien fait toutes les translations…
        $personneRepository.delete(oidToSuppr, this)
      }).done(next)
    }

    // init
    const EntityGroupe = lassi.service('EntityGroupe')
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    const $groupeRepository = lassi.service('$groupeRepository')
    const $personneRepository = lassi.service('$personneRepository')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    const translated = new Map() // pid => pid des remplacements à faire
    const doublons = new Set() // pids avec plusieurs oids
    const orphans = new Map() // oid => pid des introuvables
    const toReplace = new Map() // oid => oid des personnes à substituer
    const toSuppr = new Set() // oid des personnes à supprimer après translation si ça n'a pas planté
    // pas besoin de gérer ici le cache pour les personnes et les groupes, c'est dans le afterStore de leur entity
    let offset = 0
    let nbPersonnes = 0
    // pour le reindex, on utilise le cli de lassi
    const $entitiesCli = require('lassi/source/services/entities-cli.js')
    // reindexAll est une commande de entities-cli
    const reindexAll = $entitiesCli().commands().reindexAll

    flow().seq(function () {
      updateLog('réindexation de toutes les ressources pour ajouter auteursParents (peut être long)')
      reindexAll('EntityRessource', this)
    }).seq(function () {
      // on compte les personnes
      EntityPersonne.match().count(this)
    }).seq(function (total) {
      updateLog(`${total} personnes à traiter`)
      nbPersonnes = total
      offset = 0
      grabPersonnes(this)
    }).seq(function () {
      if (toReplace.size) replacePids(this)
      else this()
    }).seq(function () {
      grabRessources(this)
    }).seq(function (total) {
      grabGroupes(this)
    }).seq(function () {
      if (toSuppr.size) cleanObsolete(this)
      else this()
    }).seq(function () {
      updateLog('réindexation des personnes')
      reindexAll('EntityPersonne', this)
    }).seq(function () {
      updateLog('réindexation des groupes')
      reindexAll('EntityGroupe', this)
    }).seq(function () {
      if (orphans.size) {
        updateLog(`${orphans.length} personnes avec pid introuvable :`)
        orphans.forEach((pid, oid) => updateLog(`${oid} => ${pid}`))
      } else {
        updateLog(`pas de pid introuvable`)
      }
      if (toSuppr.size) updateLog(`${toSuppr.size} personnes supprimées remplacées par une autre`)
      else updateLog('pas de suppression')
      if (doublons.size) updateLog(`pids en doublon : ${Array.from(doublons).join(', ')}`)
      else updateLog('pas de doublon')
      setTimeout(done, 1000)
    }).catch(done)
  } // run
}
