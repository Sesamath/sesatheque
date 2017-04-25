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
const sesatheques = require('sesatheque-client/dist/sesatheques')
const config = require('../../config')
const myBaseId = config.application.baseId

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum
const updateLog = (message) => applog(updatePrefix, message)
const updateLogErr = (message) => applog.error(updatePrefix, message)

const name = 'normalisation du contenu des sequenceModele'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes

    function grabSequenceModeles (next) {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match('type').equals('sequenceModele').sort('oid').grab(limit, offset, this)

        // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

        // on itère
      }).seqEach(function (seqMod) {
        const nextSeqMod = this
        const sousSequences = seqMod.parametres && seqMod.parametres.sousSequences
        if (sousSequences && sousSequences.length) {
          const ssSeqCleaned = []
          flow(seqMod.parametres.sousSequences).seqEach(function (ssSeq) {
            const nextSsSeq = this
            if (ssSeq.eleves) delete ssSeq.eleves
            if (ssSeq.serie && ssSeq.serie.length) {
              cleanExos(ssSeq.serie, function (error, exos) {
                if (error) return nextSsSeq(error)
                if (ssSeq.serie.length && ssSeq.serie.length !== exos.length) {
                  updateLogErr(`on a perdu des exos dans la sous-sequence ${ssSeq.nom}, cf error.log`)
                  log.error(`la ssSeq ${ssSeq.nom} contenait les exos`, ssSeq.serie)
                  log.error(`et après nettoyage il reste`, exos)
                }
                ssSeq.serie = exos
                ssSeqCleaned.push(ssSeq)
                nextSsSeq()
              })
            } else {
              ssSeqCleaned.push(ssSeq)
              nextSsSeq()
            }
          }).seq(function () {
            seqMod.parametres.sousSequences = ssSeqCleaned
            $ressourceRepository.save(seqMod, nextSeqMod)
          }).catch(nextSeqMod)
        } else {
          nextSeqMod()
        }

        // log + suivants ou fin
      }).seq(function () {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabSequenceModeles, next)
        } else {
          next()
        }
      }).catch(next)
    }

    function grabSeries (next) {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match('type').equals('serie').sort('oid').grab(limit, offset, this)

        // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

        // on itère
      }).seqEach(function (serie) {
        const nextSerie = this
        cleanExos(serie.parametres, function (error, exos) {
          if (error) return nextSerie(error)
          if (serie.parametres.length && serie.parametres.length !== exos.length) {
            updateLogErr(`on a perdu des exos dans la serie ${serie.titre}, cf error.log`)
            log.error(`la série ${serie.titre} contenait les exos`, serie.parametres)
            log.error(`et après nettoyage il reste`, exos)
          }
          serie.parametres = exos
          $ressourceRepository.save(serie, nextSerie)
        })

        // log + suivants ou fin
      }).seq(function () {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          process.nextTick(grabSeries, next)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * Nettoie une liste d'exo en mettant un bon rid à chacun
     * @param {SesathequeItem[]} exos
     * @param next
     */
    function cleanExos (exos, next) {
      const exosCleaned = []
      if (Array.isArray(exos) && exos.length) {
        flow(exos).seqEach(function (exo) {
          const nextExo = this
          if (exo.type === 'error') {
            // on y touche pas
            exosCleaned.push(cleanItem(exo))
          } else {
            getRid(exo, function (error, rid) {
              if (error) return next(error)
              if (rid) {
                exo.rid = rid
                exosCleaned.push(cleanItem(exo))
              } else {
                exosCleaned.push({type: 'error', titre: `Cette ressource n’existe plus (${exo.type} ${exo.ref || exo.id || ''}, ${exo.titre})`})
              }
              nextExo()
            })
          }
        }).seq(function () {
          next(null, exosCleaned)
        }).catch(next)
      } else {
        next(null, exosCleaned)
      }
    }

    /**
     * passera un rid ou rien (si pas trouvé) à next
     * @param item
     * @param next
     */
    function getRid (item, next) {
      if (item.rid || item.aliasOf) {
        const rid = item.rid || item.aliasOf
        // on vérifie qu'il est valide
        try {
          sesatheques.getRidComponents(rid, false)
          return next(null, rid)
        } catch (error) {
          updateLogErr(`on a eu un item avec un rid foireux ${item.rid}, que l’on va essayer de rectifier`)
          const [baseId, id] = sesatheques.getComponents(item.rid)
          if (sesatheques.exists(baseId)) return fetchAndCheckRid(baseId, id, next)
          // sinon on met ça en ref et on laisse faire le reste
          item.ref = item.rid
          delete item.rid
        }
      }
      // on cherche
      if (item.baseId && item.id) {
        const rid = item.baseId + '/' + item.id
        next(null, rid)
      } else if (item.id && (item.displayUrl || item.base)) {
        const rid = sesatheques.getBaseIdFromUrlQcq(item.displayUrl || item.base) + '/' + item.id
        next(null, rid)
      } else if (item.ref && (item.displayUrl || item.base)) {
        const baseId = sesatheques.getBaseIdFromUrlQcq(item.displayUrl || item.base)
        if (item.ref.indexOf('/') === -1) {
          next(null, baseId + '/' + item.ref)
        } else {
          fetchAndCheckRid(baseId, item.ref, item.titre, next)
        }
      } else if (item.ref) {
        // on a pas de base, on teste les 2 mais faut la bonne paire
        const baseIds = [myBaseId]
        // et on ajoute celles déclarées en conf
        config.sesatheques.forEach(s => { baseIds.push(s.baseId) })
        let found = false
        flow(baseIds).seqEach(function (baseId) {
          const nextSesatheque = this
          if (found) return nextSesatheque()
          fetchAndCheckRid(baseId, item.ref, item.titre, function (error, rid) {
            if (error) return next(error)
            if (rid) found = rid
            nextSesatheque()
          })
        }).seq(function () {
          next(null, found)
        }).catch(next)
      } else {
        next()
      }
    }

    /**
     * Passe un rid à next (si on en trouve un)
     * @param baseId
     * @param mixId
     * @param [titre]
     * @param next
     */
    function fetchAndCheckRid (baseId, mixId, titre, next) {
      if (arguments.length === 3) {
        next = titre
        titre = null
      }
      $ressourceFetch.fetch(baseId + '/' + mixId, function (error, ressource) {
        // une erreur peut être une 404
        if (!error && ressource && ressource.rid && (titre === null || ressource.titre === titre)) return next(null, ressource.rid)
        next() // sans rien => n'existe plus
      })
    }

    function cleanItem (item) {
      // on vire toutes les propriétés obsolètes qui ont pu exister à un moment donné
      if (item.id) delete item.id
      if (item.aliasOf) delete item.ref
      if (item.baseId) delete item.baseId
      if (item.base) delete item.base
      if (item.baseUrl) delete item.baseUrl
      return item
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    const $ressourceFetch = lassi.service('$ressourceFetch')
    let offset = 0
    let nbRessources = 0

    updateLog(name)
    flow().seq(function () {
      // on compte les sequenceModele
      EntityRessource.match('type').equals('sequenceModele').sort('oid').count(this)
    }).seq(function (total) {
      updateLog(`${total} sequenceModele à traiter`)
      nbRessources = total
      if (total) grabSequenceModeles(this)
      else this()
    }).seq(function () {
      // idem pour les series
      EntityRessource.match('type').equals('serie').sort('oid').count(this)
    }).seq(function (total) {
      updateLog(`${total} series à traiter`)
      nbRessources = total
      if (total) grabSeries(this)
      else this()
    }).seq(function () {
      updateLog('fin')
      done()
    }).catch(done)
  } // run
}
