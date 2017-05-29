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
const taskLog = require('an-log')('refreshArbres')

function logErrorInDataAndTask (message, obj) {
  taskLog.error(message, obj)
  log.dataError(message, obj)
}

/**
 * Rafraichit les datas de tous les arbres
 * @param {errorCallback} done
 */
function refreshArbres (done) {
  function grab (next) {
    let nb = 0
    flow().seq(function () {
      taskLog(`traitement des arbres de ${offset} à ${offset + limit}`)
      EntityRessource.match('type').equals('arbre').sort('oid').grab(limit, offset, this)
    }).seqEach(function (arbre) {
      const nextArbre = this
      currentOid = arbre.oid
      currentTitre = arbre.titre
      nb++
      if (arbre.enfants && arbre.enfants.length) {
        process.nextTick(function () {
          cleanEnfants(arbre, false, function (error, arbreCleaned, needSave) {
            if (error) return nextArbre(error)
            if (needSave) {
              nbArbresModif++
              $ressourceRepository.save(arbreCleaned, nextArbre)
            } else {
              nextArbre()
            }
          })
        })
      } else {
        logErrorInDataAndTask(`arbre ${arbre.oid} sans enfants (${arbre.titre})`)
        nextArbre()
      }
    }).seq(function () {
      if (nb === limit) {
        // return next() // debug
        offset += limit
        grab(next)
      } else {
        next()
      }
    }).catch(next)
  } // grab

  function cleanEnfants (item, needSave, next) {
    if (item.enfants && item.enfants.length) {
      flow(item.enfants).seqEach(function (enfant) {
        const nextEnfant = this
        if (!enfant.aliasOf) {
          if (item.type && item.type !== 'error' && item.type !== 'arbre') logErrorInDataAndTask(`item sans aliasOf dans l’arbre ${currentOid} (${currentTitre})`, item)
          return nextEnfant(null, enfant)
        }
        nbRessources++
        process.nextTick(function () {
          $ressourceFetch.fetchOriginal(enfant.aliasOf, function (error, ressource) {
            if (error) {
              // si c'est une 404 on veut continuer
              if (/Aucune ressource/.test(error.message)) {
                logErrorInDataAndTask(`la ressource ${enfant.aliasOf} n’existe plus dans l’arbre ${currentOid} (${currentTitre})`)
                needSave = true
                enfant.titre = `Cette ressource n’existe plus (${enfant.titre})`
                enfant.type = 'error'
                nextEnfant(null, enfant)
              } else {
                nextEnfant(error)
              }
              // on arrête là
              return
            }
            // on a une ressource
            ;['titre', 'resume', 'description', 'commentaires'].forEach(p => {
              if (enfant[p] !== ressource[p]) {
                needSave = true
                enfant[p] = ressource[p]
              }
            })
            if (enfant.type === 'arbre' && enfant.enfants && enfant.enfants.length) {
              logErrorInDataAndTask(`item arbre avec aliasOf ${enfant.aliasOf} et enfants, on vire les enfants pour rendre le chargement dynamique, dans l’arbre ${currentOid} (${currentTitre})`)
              needSave = true
              delete enfant.enfants
            }
            if (enfant.enfants && enfant.enfants.length) {
              process.nextTick(function () {
                cleanEnfants(enfant, needSave, function (error, enfantCleaned, needSaveEnfant) {
                  if (error) return nextEnfant(error)
                  if (needSaveEnfant) needSave = true
                  nextEnfant(null, enfantCleaned)
                })
              })
            } else {
              nextEnfant(null, enfant)
            }
          })
        })
      }).seq(function (enfants) {
        item.enfants = enfants
        next(null, item, needSave)
      }).catch(next)
    } else {
      next(null, item, needSave)
    }
  }

  if (typeof done !== 'function') throw new Error('Erreur interne, pas de callback de commande')
  let offset = 0
  let limit = 10
  let nbArbres = 0
  let nbArbresModif = 0
  let nbRessources = 0
  let currentOid, currentTitre
  const EntityRessource = lassi.service('EntityRessource')
  const $ressourceRepository = lassi.service('$ressourceRepository')
  const $ressourceFetch = lassi.service('$ressourceFetch')
  flow().seq(function () {
    EntityRessource.match('type').equals('arbre').count(this)
  }).seq(function (nb) {
    nbArbres = nb
    taskLog(`Starting refreshArbres avec ${nb} arbres`)
    grab(this)
  }).seq(function () {
    taskLog(`fin du rafraichissement de ${nbArbres} arbres (contenant ${nbRessources} ressources), dont ${nbArbresModif} modifiés`)
    done()
  }).catch(done)
}

refreshArbres.help = function refreshArbresHelp () {
  taskLog('La commande refreshArbres ne prend pas d’arguments, elle lance le rafraîchissement des données de tous les arbres')
}

/**
 * Service de gestion des updates via cli
 * @service $update-cli
 */
module.exports = {
  refreshArbres
}
