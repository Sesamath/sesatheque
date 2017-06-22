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
const {exists, getBaseIdFromRid, getComponents} = require('sesatheque-client/dist/sesatheques')

const config = require('../../config')
const myBaseId = config.application.baseId
const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)
const updateLogErr = updateLog.error

const name = 'nettoyage des rid ou aliasOf invalides (converti la ressource ou ref en type:error)'
const description = ''

const limit = 100

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    // fcts internes

    /**
     * Vérifie que aliasOf est clean, cherche l'original pour remplacer aliasOf
     * ou le vire si on trouve pas l'original
     * @param item
     * @param hasChanged
     * @param next
     */
    function cleanAlias (item, hasChanged, next) {
      function drop () {
        dropAliasOf(item)
        next(null, true)
      }
      const [baseId, id] = getComponents(item.aliasOf)
      if (baseId && exists(baseId)) {
        if (id.indexOf('/') === -1) {
          // aliaOf plausible avec baseId connue, on vérifie pas que ça existe réellement,
          // ça donnera éventuellement du 404 mais le code plantera pas
          return next(null, hasChanged)
        } else {
          // c'est du origine/idOrigine, faut l'oid
          $ressourceFetch.fetchOriginal(item.aliasOf, function (error, original) {
            if (error || !original || !original.rid) {
              drop()
            } else {
              item.aliasOf = original.rid
              next(null, true)
            }
          })
        }
      } else {
        drop()
      }
    }

    /**
     * Nettoie les enfants d'un arbre de leur aliasOf invalide d'après les infos de ridToClean
     * @param arbre
     */
    function cleanArbre (arbre) {
      arbre.enfants.forEach((e) => {
        if (e.aliasOf && !isGoodRid(e.aliasOf)) {
          const goodRid = ridToClean.get(e.aliasOf)
          if (goodRid) {
            e.aliasOf = goodRid
          } else {
            log.dataError(`Impossible de trouver le rid correspondant à ${e.aliasOf}`)
            dropAliasOf(e)
          }
        }
        if (e.type === 'arbre' && e.enfants && e.enfants.length) cleanArbre(e)
      })
      if (arbre.oid) updateLog(`arbre ${arbre.oid} nettoyé`)
    }

    /**
     * Passe grab, vérifie rid et aliasOf et corrige
     * @param ressource
     * @param next
     */
    function cleanRessource (ressource, next) {
      let hasChanged = false
      try {
        if (ressource.oid) getBaseIdFromRid(ressource.rid)
      } catch (error) {
        hasChanged = true
        log.error(`rid ${ressource.rid} invalide sur ${ressource.oid}`)
        ressource.rid = myBaseId + '/' + ressource.oid
      }
      if (ressource.aliasOf) cleanAlias(ressource, hasChanged, next)
      else next(null, hasChanged)
    }

    /**
     * Passe le type en error, efface aliasOf (et enfants si y'en a)
     * et sauvegarde les anciennes valeurs dans parametres.original
     * @param {Ressource|Ref} item
     */
    function dropAliasOf (item) {
      // baseId vide ou inconnue
      if (item.oid) log.error(`aliasOf ${item.aliasOf} invalide sur ${item.oid}`)
      else log.error(`ref ${item.titre} avec ${item.aliasOf} invalide`)
      // on sauvegarde qq infos dans les paramètres
      if (!item.parametres) item.parametres = {}
      if (!item.parametres.original) item.parametres.original = {}
      item.parametres.original = {
        titre: item.titre,
        aliasOf: item.aliasOf,
        type: item.type
      }
      if (item.enfants) {
        if (item.enfants.length) item.parametres.original.enfants = item.enfants
        delete item.enfants
      }
      item.titre += ' (alias invalide)'
      item.type = 'error'
      delete item.aliasOf
    }

    /**
     * Ajoute tous les aliasOf invalides des enfants à ridToClean
     * @param arbre
     */
    function extractBadRid (arbre, oid) {
      function add (aliasOf) {
        // dans cette première passe, on stocke l'oid du parent dans notre map
        ridToClean.set(aliasOf, {parent: oid})
        oidToClean.add(oid)
      }
      if (!oid && arbre.oid) oid = arbre.oid
      arbre.enfants.forEach((enfant) => {
        if (enfant.aliasOf && !isGoodRid(enfant.aliasOf)) add(enfant.aliasOf)
        if (enfant.rid) log.error(`trouvé un rid ${enfant.rid} dans un enfant de ${arbre.oid || arbre.aliasOf || arbre.titre}`, arbre)
        if (enfant.type === 'arbre' && enfant.enfants && enfant.enfants.length) extractBadRid(enfant, oid)
      })
    }

    /**
     * itère sur ridToClean pour mettre à chacun le rid original
     * @param next
     */
    function fetchRigthsRids (next) {
      // ridToClean est un map, keys renvoie aussi un map, on veut un array
      flow([...ridToClean.keys()]).seqEach(function (rid) {
        function logErr (error) {
          const msg = `impossible de trouver l’original de ${rid} (parent ${ridToClean.get(rid).parent})`
          updateLogErr(msg)
          log.dataError(msg, error)
          ridToClean.set(rid, null)
          nextRid()
        }
        const nextRid = this
        // fetchOriginal veut un vrai rid, faut d'abord aller le chercher…
        $ressourceFetch.fetchRid(rid, function (error, goodRid) {
          if (error || !goodRid) return logErr(error)
          $ressourceFetch.fetchOriginal(goodRid, function (error, original) {
            if (error || !original || !original.rid) return logErr(error)
            ridToClean.set(rid, original.rid)
            nextRid()
          })
        })
      }).seq(function () {
        updateLog('fin récup des bons rid')
        next()
      }).catch(next)
    }

    /**
     * parcours oidToClean pour les nettoyer avec cleanArbre, après complétion de ridToClean
     */
    function fixRids (next) {
      if (oidToClean.size) {
        flow([...oidToClean]).seqEach(function (oid) {
          const nextOid = this
          EntityRessource.match('oid').equals(oid).grabOne(function (error, arbre) {
            if (error) return next(error)
            cleanArbre(arbre)
            arbre.store(nextOid)
            $cacheRessource.delete(arbre.oid)
          })
        }).seq(function () {
          updateLog(`2e passe terminée (${oidToClean.size} arbres nettoyés)`)
          next()
        }).catch(next)
      } else {
        updateLog('2e passe inutile')
        next()
      }
    }
    /**
     * 1re passe pour récupérer toutes les ressources et les envoyer à cleanRessource
     * et extractBadRid
     */
    function grab (next) {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

      // on itère
      }).seqEach(function (ressource) {
        // async donc 2e flux
        const nextRessource = this
        let needSave = false
        flow().seq(function () {
          cleanRessource(ressource, this)
        }).seq(function (hasChanged) {
          if (hasChanged) needSave = true
          // on ne peut pas traiter les arbres en récursif ici avec de l'async
          // => Maximum call stack size exceeded
          // on note donc d'abord toutes les refs à aller chercher
          if (ressource.type === 'arbre' && ressource.enfants && ressource.enfants.length) extractBadRid(ressource)
          if (needSave) ressource.store(this)
          else this()
        }).seq(function (ressource) {
          if (ressource) $cacheRessource.delete(ressource.oid)
          nextRessource()
        }).catch(function (error) {
          log.error(error)
          nextRessource()
        })

      // log + suivants ou fin
      }).seq(function () {
        updateLog(`parsing de ${offset} à ${offset + currentTotal - 1} sur ${nbRessources}`)
        if (currentTotal === limit) {
          offset += limit
          setTimeout(() => grab(next), 0)
        } else {
          next()
        }
      }).catch(next)
    }

    /**
     * Retourne true si le rid est plausible (baseId connue et id non vide sans slash dedans)
     * @param rid
     * @return {*|boolean}
     */
    function isGoodRid (rid) {
      const [baseId, id] = getComponents(rid)
      return baseId && exists(baseId) && id.indexOf('/') === -1
    }

    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')
    const $ressourceFetch = lassi.service('$ressourceFetch')
    let offset = 0
    let nbRessources = 0
    // pour stocker tous les rid incorrect et les résoudre ensuite
    const ridToClean = new Map()
    // les oid qu'il faudra retourner nettoyer dans une 2e passe
    const oidToClean = new Set()

    updateLog(name)
    // on compte et on y va
    EntityRessource.match().count(function (error, total) {
      if (error) return done(error)
      if (total === 0) {
        updateLog('Aucune ressource en base de données, rien à traiter')
        return done()
      }
      updateLog(`${total} ressources à traiter`)
      nbRessources = total
      // nos passes sur les ressources
      flow().seq(function () {
        grab(this)
      }).seq(function () {
        // ridToClean est rempli, on le passe en revue
        if (ridToClean.size) {
          updateLog(`On va aller chercher les bons aliasOf pour ${ridToClean.size} enfants (${oidToClean.size} arbres)`)
          fetchRigthsRids(this)
        } else {
          updateLog(`Aucun aliasOf invalide`)
          this()
        }
      }).seq(function () {
        if (oidToClean.size) {
          updateLog(`Corrections de ces ${ridToClean.size} enfants pour ${oidToClean.size} arbres`)
          fixRids(this)
        } else {
          updateLog(`Aucun arbre à rectifier`)
          this()
        }
      }).seq(function () {
        if (oidToClean.size) updateLog(`2e passe terminée (${oidToClean.size} arbres nettoyés)`)
        done()
      }).catch(done)
    })
  } // run
}
