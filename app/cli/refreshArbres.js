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
const Ref = require('../constructors/Ref')
const configRessource = require('../ressource/config')

function logErrorInDataAndTask (message, obj) {
  taskLog.error(message)
  log.dataError(message, obj)
}

/**
 * Rafraichit les datas de tous les arbres
 * @param {string} [oid]
 * @param {errorCallback} done
 */
function refreshArbres (oid, done) {
  function grab (next) {
    let nb = 0
    flow().seq(function () {
      taskLog(`traitement des arbres de ${offset} à ${offset + limit} sur ${nbArbres}`)
      EntityRessource.match('type').equals('arbre').sort('dateCreation').grab({limit, offset}, this)
    }).seqEach(function (arbre) {
      nb++
      refreshOne(arbre, this)
    }).seq(function () {
      if (nb === limit) {
        offset += limit
        grab(next)
      } else {
        next()
      }
    }).catch(next)
  } // grab

  /**
   * Met éventuellement à jour les enfants de item
   * @private
   * @param {Ref} item l'arbre à vérifier
   * @param next appelé avec (error, itemClean, hasChanged)
   */
  function cleanEnfants (item, next) {
    if (item.enfants && item.enfants.length) {
      // boucle sur les enfants
      let hasChanged = false
      flow(item.enfants).seqEach(function (enfant) {
        const nextEnfant = this
        process.nextTick(cleanEnfant, enfant, function (error, enfantCleaned, enfantsHadChanges) {
          if (error) return nextEnfant(error)
          if (enfantsHadChanges) hasChanged = true
          nextEnfant(null, enfantCleaned)
        })
        /*
        // une ref externe "normale"
        if (enfant.aliasOf) {
          nbRessources++
          process.nextTick(cleanEnfant, enfant, function (error, enfantCleaned, hasChanged) {
            if (error) return nextEnfant(error)
            if (hasChanged) needSave = true
            nextEnfant(null, enfantCleaned)
          })

        // cas d'un "dossier" sans aliasOf avec enfants
        } else if (item.type === 'arbre') {
          // avec enfants
          if (item.enfants && item.enfants.length) {
            flow(item.enfants).seq(function (petitEnfant) {
              const nextPetitEnfant = this
              process.nextTick(cleanEnfant, petitEnfant, function (error, petitEnfantCleaned, hasChanged) {
                if (error) return nextPetitEnfant(error)
                if (hasChanged) needSave = true
                nextPetitEnfant(null, petitEnfantCleaned)
              })
            }).seq(function (petitsEnfants) {
              enfant.enfants = petitsEnfants
              nextEnfant(null, enfant)
            }).catch(nextEnfant)
          // dossier vide
          } else {
            nextEnfant(null, enfant)
          }

        // erreur
        } else if (item.type === 'error') {
          nextEnfant(null, enfant)

        // cas anormal
        } else {
          logErrorInDataAndTask(`item sans aliasOf dans l’arbre ${currentOid} (${currentTitre})`, item)
          nextEnfant(null, enfant)
        } /* */
      }).seq(function (enfants) {
        item.enfants = enfants
        next(null, item, hasChanged)
      }).catch(next)
    } else {
      next(null, item, false)
    }
  }

  /**
   * Vérifie s'il faut modifier ref
   * @private
   * @param {Ref} ref
   * @param next appelé avec (error, ref, hasChanged)
   */
  function cleanEnfant (ref, next) {
    let hasChanged = false
    // alias, on fetch et compare
    if (ref.aliasOf) {
      nbRessources++
      $ressourceFetch.fetchOriginal(ref.aliasOf, function (error, ressource) {
        if (error) {
          // si c'est une 404 on veut continuer
          if (/Aucune ressource/.test(error.message)) {
            logErrorInDataAndTask(`la ressource ${ref.aliasOf} n’existe plus dans l’arbre ${currentOid} (${currentTitre})`)
            hasChanged = true
            ref.titre = `Cette ressource n’existe plus (${ref.titre})`
            ref.type = 'error'
            hasChanged = true
            next(null, ref, hasChanged)
          } else {
            next(error)
          }
          // on arrête là
          return
        }
        // on a une ressource
        flow().seq(function () {
          const nextStep = this
          // on regarde si elle n'est pas obsolète
          if (!ressource.relations) return nextStep()
          const replacedByRelation = ressource.relations.find(r => r[0] === configRessource.constantes.relations.estRemplacePar)
          if (!replacedByRelation) return nextStep()
          // y'a un remplaçant désigné, on le cherche
          $ressourceFetch.fetchOriginal(replacedByRelation[1], function (error, ressource) {
            // si y'a un remplaçant c'est fini
            if (!error && ressource) return next(null, new Ref(ressource), true)
            // sinon on continue avec la ressource initiale
            nextStep()
          })
        }).seq(function () {
          ;['titre', 'resume', 'description', 'commentaires'].forEach(p => {
            if (ref[p] !== ressource[p]) {
              hasChanged = true
              ref[p] = ressource[p]
            }
          })
          // public ?
          if (ressource.publie && !ressource.restriction && !ref.public) {
            ref.public = true
            hasChanged = true
          }
          if (ref.type === 'arbre' && ref.enfants && ref.enfants.length) {
            logErrorInDataAndTask(`item arbre avec aliasOf ${ref.aliasOf} et enfants, on vire les enfants pour rendre le chargement dynamique, dans l’arbre ${currentOid} (${currentTitre})`)
            hasChanged = true
            delete ref.enfants
          }
          next(null, ref, hasChanged)
        }).catch(next)
      })

    // error, on fait suivre tel quel
    } else if (ref.type === 'error') {
      next(null, ref, hasChanged)

    // dossier
    } else if (ref.type === 'arbre') {
      // on nettoie les enfants
      if (ref.enfants && ref.enfants.length) {
        process.nextTick(cleanEnfants, ref, function (error, refCleaned, needSaveRef) {
          if (error) return next(error)
          if (needSaveRef) hasChanged = true
          next(null, refCleaned, hasChanged)
        })
      // si vide, on fait suivre tel quel
      } else {
        next(null, ref, hasChanged)
      }

    // cas inconnu, on laisse en le signalant
    } else {
      logErrorInDataAndTask(new Error('enfant sans aliasOf, ni error ni arbre'), ref)
      next(null, ref, hasChanged)
    }
  }

  function refreshOne (arbre, next) {
    currentOid = arbre.oid
    currentTitre = arbre.titre
    if (arbre.enfants && arbre.enfants.length) {
      process.nextTick(function () {
        cleanEnfants(arbre, function (error, arbreCleaned, needSave) {
          if (error) return next(error)
          if (needSave) {
            nbArbresModif++
            $ressourceRepository.save(arbreCleaned, next)
          } else {
            next()
          }
        })
      })
    } else {
      logErrorInDataAndTask(`arbre ${arbre.oid} sans enfants (${arbre.titre})`)
      next()
    }
  }

  if (typeof oid === 'function') {
    done = oid
    oid = undefined
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
  if (oid) {
    flow().seq(function () {
      EntityRessource.match('oid').equals(oid).grabOne(this)
    }).seq(function (arbre) {
      if (!arbre) {
        taskLog(`L’arbre ${oid} n’existe pas`)
        return done()
      }
      taskLog(`Starting refreshArbres ${oid}`)
      refreshOne(arbre, this)
    }).seq(function () {
      taskLog(`fin du rafraichissement de l’arbre ${oid} (contenant ${nbRessources} ressources), il ${nbArbresModif ? 'a' : 'n’a pas'} été modifié.`)
      done()
    }).catch(done)
  } else {
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
}

refreshArbres.help = function refreshArbresHelp () {
  taskLog('La commande refreshArbres prend un oid en argument pour mettre à jour l’arbre, sans argument elle lance le rafraîchissement des données de tous les arbres')
}

module.exports = {
  refreshArbres
}
