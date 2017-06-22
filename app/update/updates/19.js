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

const name = 'normalisation du contenu des sequenceModele'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes
    function logBoth (msg) {
      updateLogErr(msg)
      log.dataError(msg)
    }

    function grab (next) {
      let currentTotal
      flow().seq(function () {
        baseQuery.grab(limit, offset, this)

        // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

        // on itère
      }).seqEach(function (ressource) {
        const nextRessource = this
        // flux de traitement des auteurs
        flow().seq(function () {
          rectifAuteurs(ressource, this)
        }).seq(function (pids) {
          if (pids.length) {
            ressource.auteurs = pids
            ressource.store(this)
          } else {
            logBoth(`Pas trouvé les vrais auteurs de la ressource ${ressource.oid}`)
            nextRessource()
          }
        }).seq(function () {
          nextRessource()
        }).catch(next)

        // log + suivants ou fin
      }).seq(function (pids) {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grab, next)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * Nettoie une liste d'exo en mettant un bon rid à chacun
     * @param {Ressource} exos
     * @param next
     */
    function rectifAuteurs (auteurs, next) {
      if (Array.isArray(auteurs) && auteurs.length) {
        flow(auteurs).seqEach(function (pid) {
          rectifAuteur(pid, this)
        }).seq(function (pids) {
          const pidsCleaned = pids.filter(pid => pid)
          next(null, pidsCleaned)
        }).catch(next)
      } else {
        next(null, [])
      }
    }

    /**
     *
     * @param pid
     * @param next
     */
    function rectifAuteur (pid, next) {
      // si on a déjà traité ce pid ça va plus vite
      if (pidsTranslated[pid]) return next(null, pidsTranslated[pid])
      // sinon on cherche
      flow().seq(function () {
        EntityPersonne.match('pid').equals(pid).grab(this)
      }).seq(function (auteurs) {
        if (auteurs.length === 0) {
          notFound.add(pid)
          return next()
        }
        if (auteurs.length > 1) {
          // si y'en a plusieurs y'a un pb
          const msg = `${auteurs.length} auteurs ayant le pid ${pid} !`
          updateLogErr(msg)
          log.dataError(msg)
        }
        // on cherche maintenant le bon
        const auteurPresume = auteurs.find(auteur => auteur.origine && auteur.idOrigine)
        if (auteurPresume) {
          const pidPresume = auteurPresume.origine + '/' + auteurPresume.idOrigine
          let auteurTrouve
          flow().seq(function () {
            // on cherche
            EntityPersonne.match('pid').equals(pidPresume).grab(this)
          }).seq(function (auteursOk) {
            // on efface d'éventuels surnuméraires
            const nextStep = this
            auteurTrouve = auteursOk.pop()
            if (auteursOk.length) {
              logBoth(`Plusieurs auteurs ${pidPresume}, on n’en garde qu’un`)
              flow(auteursOk).seqEach(function (auteur) {
                auteur.delete(this)
              }).seq(function () {
                nextStep()
              }).catch(next)
            } else {
              nextStep()
            }
          }).seq(function () {
            // si on en a pas trouvé on arrête là
            if (!auteurTrouve) {
              orphans.set(pid, pidPresume)
              return next()
            }
            // on efface les anciens
            this(auteurs)
          }).seqEach(function (auteur) {
            auteur.delete(this)
          }).seq(function () {
            pidsTranslated[pid] = auteurTrouve.pid
            next(null, auteurTrouve.pid)
          }).catch(next)
        } else {
          logBoth(`auteur ${pid} trouvé mais sans origine et idOrigine`)
        }
      }).catch(next)
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const EntityPersonne = lassi.service('EntityPersonne')
    let offset = 0
    let nbRessources = 0
    // pour se simplifier la vie et éviter de passer un argument à grab
    let baseQuery
    // stockage des infos d'avancement
    let pidsTranslated = {}
    let notFound = new Set()
    let orphans = new Map()

    updateLog(name)
    flow().seq(function () {
      // on traite les auteurs
      baseQuery = EntityRessource.match('auteurs').like(`${myBaseId}/%`).sort('oid')
      baseQuery.count(this)
    }).seq(function (total) {
      updateLog(`${total} ressources à traiter`)
      nbRessources = total
      if (total) grab(this)
      else this()
    }).seq(function () {
      // log de fin
      notFound.forEach(pid => logBoth(`Auteur ${pid} introuvable`))
      orphans.forEach((orphanPid, pid) => logBoth(`${pid} mène à ${orphanPid} mais il n’y a personne au bout`))
      // on vérifie qu'il n'y a plus de ressource d'origine labomepPERSOS sans auteur sesasso
      EntityRessource.match('origine').equals('labomepPERSOS').sort('oid').grab(this)
    }).seqEach(function (ressource) {
      const msgPrefix = `la ressource ${ressource.oid} (labomepPERSOS/${ressource.idOrigine})`
      if (ressource.auteurs.length !== 1) logBoth(`${msgPrefix} a ${ressource.auteurs.length} auteurs !`)
      if (ressource.auteurs.length && !/sesasso\//.test(ressource.auteurs[0])) logBoth(`${msgPrefix} a un auteur ${ressource.auteurs[0]}`)
      this()
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
