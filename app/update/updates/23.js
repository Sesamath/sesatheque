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
  'labomep.local': 'labomepLocal'
}

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes

    function reindexRessources (next) {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match().grab(limit, offset, this)

        // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)
        // on itère
      }).seqEach(function (ressource) {
        if (!ressource.origine) {
          if (ressource.aliasOf || ressource.type === 'error') {
            ressource.origine = myBaseId
            $ressourceRepository.save(ressource, this)
          } else {
            logBoth(`ressource ${ressource.oid} sans origine`, ressource)
            this()
          }
        } else {
          ressource.reindex(this)
        }
      }).seq(function () {
        updateLog(`réindex des ressources de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(reindexRessources, next)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * 1re passe pour récupérer toutes les personnes et fixer leur pid
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
        // les pids déjà OK
        if (/^sesasso\/.+/.test(personne.pid)) return nextPersonne()
        if (/^labomep\/.+/.test(personne.pid)) return nextPersonne()
        if (/^labomepDev\/.+/.test(personne.pid)) return nextPersonne()
        if (/^labomepLocal\/.+/.test(personne.pid)) return nextPersonne()
        const matches = /^([a-z.]+)\/([a-z0-9]+)$/.exec(personne.pid)
        if (matches && matches.length > 2) {
          const [, domain, oid] = matches
          if (translate[domain]) {
            nbModifs++
            const newPid = translate[domain] + '/' + oid
            if (translated.has(personne.pid)) {
              logBoth(`personne ${oid} avec pid ${personne.pid} en double (pid déjà rencontré)`)
            }
            translated.set(personne.pid, newPid)
            personne.pid = newPid
            $personneRepository.save(personne, nextPersonne)
          } else {
            logBoth(`personne ${oid} sans pid d’origine connu (${personne.pid})`, personne)
            nextPersonne()
          }
        } else {
          logBoth(`personne ${personne.oid} avec pid ${personne.pid} non conforme`, personne)
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

    // init
    const EntityGroupe = lassi.service('EntityGroupe')
    const EntityPersonne = lassi.service('EntityPersonne')
    const EntityRessource = lassi.service('EntityRessource')
    const $groupeRepository = lassi.service('$groupeRepository')
    const $personneRepository = lassi.service('$personneRepository')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    const translated = new Map()
    // pas besoin de gérer ici le cache pour les personnes et les groupes, c'est dans le afterStore de leur entity
    let offset = 0
    let nbPersonnes = 0
    let nbRessources = 0

    updateLog(name)
    flow().seq(function () {
      // nb de ressources
      EntityRessource.match().count(this)
    }).seq(function (total) {
      nbRessources = total
      reindexRessources(this)
    }).seq(function () {
      // on compte les personnes
      EntityPersonne.match().count(this)
    }).seq(function (total) {
      updateLog(`${total} personnes à traiter`)
      nbPersonnes = total
      offset = 0
      grabPersonnes(this)
    }).seq(function () {
      grabRessources(this)
    }).seq(function (total) {
      grabGroupes(this)
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
