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
const {getRidComponents} = require('sesatheque-client/src/sesatheques')

const myBaseId = config.application.baseId
const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum
const updateLog = (message) => applog(updatePrefix, message)

const name = 'passe en public tous les arbres enfants de labomep_all'
const description = ''

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    /**
     * Nettoie les enfants d'un arbre de leur aliasOf invalide d'après les infos de ridToClean
     * @param {Ressource} arbre
     * @param {function} next appellé avec (error, todoThen), todoThen est un Set de rid à charger et nettoyer
     */
    function cleanArbre (arbre, next) {
      if (!arbre.oid || !arbre.store) throw new Error('cleanArbre ne traite que des entity')
      if (arbre.type !== 'arbre') throw new Error('cleanArbre ne traite que des arbres')

      const todoThen = new Set()
      nb++

      let hasChanged = cleanItem(arbre)
      // les enfants
      if (arbre.enfants && arbre.enfants.length) {
        hasChanged = cleanEnfantsSync(arbre.enfants, todoThen) || hasChanged
      } else {
        log.errorData(`arbre ${arbre.oid} sans enfants`)
      }

      if (hasChanged) {
        updateLog(`enregistrement des modifications de ${arbre.rid} (${arbre.titre})`)
        arbre.store(function (error, arbre) {
          if (error) return next(error)
          $cacheRessource.delete(arbre.oid)
          next(null, todoThen)
        })
      } else {
        // if (arbre.oid) updateLog(`pas de modifications pour ${arbre.oid} (${arbre.titre})`)
        next(null, todoThen)
      }
    }

    /**
     * Nettoie tous les enfants présent dans l'arbre et ajoute les alias à todoThen
     * @param {Array} enfants
     * @param {Set} todoThen Sera complété avec d'éventuels aliasOf
     * @return {boolean} true si un enfant a changé
     */
    function cleanEnfantsSync (enfants, todoThen) {
      let hasChanged = false
      enfants.forEach(function (enfant) {
        // clean de cet enfant
        hasChanged = cleanItem(enfant) || hasChanged
        // on profite de l'itération pour compléter todoThen
        if (enfant.type === 'arbre') {
          if (enfant.aliasOf) todoThen.add(enfant.aliasOf)
          // parsing de ses enfants
          else if (enfant.enfants && enfant.enfants.length) hasChanged = cleanEnfantsSync(enfant.enfants, todoThen) || hasChanged
        }
      })
      return hasChanged
    }

    function cleanItem (item) {
      let hasChanged = false
      // par sécurité on ne change que l'aspect public des arbres
      // (au cas où un corrigé se serait glissé dans un arbre sesamath)
      if (item.type === 'arbre') {
        if (item.hasOwnProperty('restriction')) {
          if (item.restriction) {
            hasChanged = true
            item.restriction = 0
          }
        } else if (item.hasOwnProperty('public')) {
          if (!item.public) {
            hasChanged = true
            item.public = true
          }
        }
      } else if (item.hasOwnProperty('public') && !item.public) {
        log.errorData('item privé dans un arbre sesamath', item)
      }
      return hasChanged
    }

    /**
     * Charge un arbre et le nettoie
     * @param {string} rid
     * @param {Set} todoThen le set après avoir enlevé rid mais ajouté ses enfants éventuels
     * @param next
     */
    function loadAndClean (rid, todoThen, next) {
      const [baseId, oid] = getRidComponents(rid)
      if (baseId !== myBaseId) {
        log(`rid externe skipped ${rid}`)
        todoThen.delete(rid)
        return next(null, todoThen)
      }
      $ressourceRepository.load(oid, function (error, arbre) {
        if (error) return next(error)
        if (arbre && arbre.oid) {
          cleanArbre(arbre, function (error, ridsToAdd) {
            if (error) return next(error)
            if (ridsToAdd.size) ridsToAdd.forEach((rid) => todoThen.add(rid))
            todoThen.delete(arbre.rid)
            next(null, todoThen)
          })
        } else {
          log.errorData(`l’arbre ${oid} n’existe pas`)
          todoThen.delete(rid)
          next()
        }
      })
    }

    /**
     * Purge les oids de todoThen (se rappelle s'il en reste à la fin)
     * @param {Set} todoThen
     * @param {errorCallback} next
     */
    function purge (todoThen, next) {
      log(`purge de ${[...todoThen].join(' ')}`)
      if (todoThen.size) {
        flow([...todoThen]).seqEach(function (rid) {
          const nextOid = this
          // on reset la call stack
          process.nextTick(function () {
            try {
              loadAndClean(rid, todoThen, nextOid)
            } catch (error) {
              nextOid(error)
            }
          }, 0)
        }).seq(function () {
          if (todoThen.size) {
            process.nextTick(function () {
              try {
                purge(todoThen, next)
              } catch (error) {
                next(error)
              }
            })
          } else {
            next()
          }
        }).catch(function (error) {
          next(error)
        })
      } else {
        next()
      }
    }

    // init
    const $cacheRessource = lassi.service('$cacheRessource')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    let nb = 0

    updateLog(name)
    flow().seq(function () {
      // $ressourceRepository.getListe('all', {filters: [{index: 'origine', values: ['sesamath']}]}, this)
      $ressourceRepository.loadByOrigin('sesamath', 'labomep_all', this)
    }).seq(function (all) {
      cleanArbre(all, this)
    }).seq(function (todoThen) {
      purge(todoThen, this)
    }).seq(function () {
      updateLog(`traitement de ${nb} arbres terminé`)
      done()
    }).catch(done)
  } // run
}
