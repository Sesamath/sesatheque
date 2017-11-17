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
const {getRidComponents} = require('sesatheque-client/src/sesatheques')

const config = require('../../config')
const Ref = require('../../constructors/Ref')
const myBaseId = config.application.baseId

const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
// an-log ne fait rien ici si on l'appelle avec le même config.application.name que update/index.js !
const updateLog = require('an-log')(config.application.name + ' update' + updateNum)
// ex update 16 qu'il faut repasser
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
      if (!arbre) throw new Error('cleanArbre appelé sans arbre')
      if (!arbre.oid || !arbre.store) throw new Error('cleanArbre ne traite que des entity')
      if (arbre.type !== 'arbre') throw new Error('cleanArbre ne traite que des arbres')
      currentArbre = arbre.oid
      currentArbreHasInvalidAliases = false

      const todoThen = new Set()
      nb++
      // on informe de l'avancement
      if (!(nb % 50)) updateLog(`traitement du ${nb}e arbre`)

      let hasChanged = cleanItem(arbre)
      flow().seq(function () {
        // traitement sync
        if (!arbre.enfants || !arbre.enfants.length) {
          log.dataError(`arbre ${arbre.oid} sans enfants`)
          return this()
        }
        hasChanged = cleanEnfantsSync(arbre.enfants, todoThen) || hasChanged
        hasChanged = dedupEnfants(arbre) || hasChanged
        // pour les alias invalides c'est async
        const nextStep = this
        if (currentArbreHasInvalidAliases) {
          // log.dataError(`on tente de résoudre ${currentArbre}`) // debug
          resolveAlias(arbre, hasChanged, function (error, cleanedArbre, hasReallyChanged) {
            if (error) return nextStep(error)
            if (hasReallyChanged) {
              arbre = cleanedArbre
              hasChanged = true
            }
            nextStep()
          })
        } else {
          nextStep()
        }
      }).seq(function () {
        if (hasChanged) {
          updateLog(`enregistrement des modifications de ${arbre.rid} (${arbre.titre})`)
          $ressourceRepository.save(arbre, function (error, arbre) {
            if (error) return next(error)
            next(null, todoThen)
          })
        } else {
          // if (arbre.oid) updateLog(`pas de modifications pour ${arbre.oid} (${arbre.titre})`)
          next(null, todoThen)
        }
      }).catch(next)
    }

    /**
     * vire les enfants en double récursivement (sync)
     * @param arbre
     * @return {boolean} true si on a modifié arbre
     */
    function dedupEnfants (arbre) {
      let hasChanged = false
      const enfantsStr = new Set()
      const enfantsDedup = arbre.enfants.filter(enfant => {
        const str = JSON.stringify(enfant)
        if (enfantsStr.has(str)) return false
        enfantsStr.add(str)
        if (enfant.enfants && enfant.enfants.length) hasChanged = dedupEnfants(enfant) || hasChanged
        return true
      })
      if (enfantsDedup.length === arbre.enfants.length) return hasChanged
      log.error(`l’arbre ${arbre.titre} avait des enfants en double`)
      arbre.enfants = enfantsDedup
      return true
    }

    /**
     * Nettoie tous les enfants présent dans l'arbre et ajoute les alias à todoThen
     * @param {Array} enfants
     * @param {Set} todoThen Sera complété avec d'éventuels aliasOf
     * @return {boolean} true si un enfant a changé
     */
    function cleanEnfantsSync (enfants, todoThen) {
      let hasChanged = false
      // on a parfois des enfants en double, on passe par du json pour comparer
      enfants.forEach(function (enfant) {
        // clean de cet enfant
        hasChanged = cleanItem(enfant) || hasChanged
        // on profite de l'itération pour compléter todoThen
        if (enfant.type === 'arbre') {
          if (enfant.aliasOf) {
            todoThen.add(enfant.aliasOf)
            if (enfant.enfants && enfant.enfants.length) {
              // alias + enfant, pas normal,
              log.dataError(`arbre avec un enfant ayant aliasOf ${enfant.aliasOf} et ${enfant.enfants.length} enfants (virés pour lazy loading)`)
              // on vire les enfants
              enfant.enfants = []
              hasChanged = true
            }
          } else if (enfant.enfants && enfant.enfants.length) {
            hasChanged = cleanEnfantsSync(enfant.enfants, todoThen) || hasChanged
          }
          // parsing de ses enfants
        }
      })
      return hasChanged
    }

    /**
     * passe si besoin restriction à 0, public à true, publie à true
     * @private
     * @param item
     * @return {boolean} true si y'a eu une modif
     */
    function cleanItem (item) {
      let hasChanged = false
      if (item.hasOwnProperty('restriction')) {
        if (item.restriction) {
          log.dataError(`item restreint dans l’arbre ${currentArbre}`, item)
          hasChanged = true
          item.restriction = 0
        }
      } else if (item.hasOwnProperty('public')) {
        if (!item.public) {
          log.dataError(`item privé dans l’arbre ${currentArbre}`, item)
          hasChanged = true
          item.public = true
        }
      }
      if (item.hasOwnProperty('publie') && !item.publie) {
        log.dataError(`item privé dans l’arbre ${currentArbre}`, item)
        hasChanged = true
        item.publie = true
      }
      if (item.aliasOf) {
        ridToClean.add(item.aliasOf)
      } else if (item.type === 'error') {
        log.dataError(`item error dans l’arbre ${currentArbre}`, item)
        if (/alias invalide/.test(item.titre)) {
          // on le marque pour résolution ultérieure
          // log.dataError(`faudra tenter de résoudre ${currentArbre}`) // debug
          currentArbreHasInvalidAliases = true
        }
      } else if (item.type !== 'arbre') {
        log.dataError(`item non arbre sans aliasOf dans l’arbre ${currentArbre}`, item)
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
            if (ridsToAdd.size) ridsToAdd.forEach(rid => todoThen.add(rid))
            todoThen.delete(arbre.rid)
            next()
          })
        } else {
          log.dataError(`l’arbre ${oid} n’existe pas`)
          todoThen.delete(rid)
          next()
        }
      })
    }

    function loadAndClean2 (rid, next) {
      const [baseId, oid] = getRidComponents(rid)
      if (baseId !== myBaseId) {
        log(`rid externe skipped ${rid}`)
        return next()
      }
      $ressourceRepository.load(oid, function (error, ressource) {
        if (error) return next(error)
        if (!ressource) {
          log.dataError(`La ressource ${oid} n’existe pas`)
          return next()
        }
        let hasChanged = false
        if (ressource.restriction) {
          log.dataError(`ressource ${ressource.oid} privée (dans un arbre sesamath)`)
          ressource.restriction = 0
          hasChanged = true
        }
        if (!ressource.publie) {
          log.dataError(`ressource ${ressource.oid} non publiée (dans un arbre sesamath)`)
          ressource.publie = true
          hasChanged = true
        }
        if (hasChanged) {
          $ressourceRepository.save(ressource, next)
        } else {
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
      // log(`purge de ${[...todoThen].join(' ')}`)
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

    /**
     * Cherche les alias en erreur dans l'arbre pour tenter de les résoudre
     * @param arbre
     * @param hasChanged
     * @param next appelé avec (error, arbre, hasChanged)
     */
    function resolveAlias (arbre, hasChanged, next) {
      let aliasResolved = false
      flow(arbre.enfants).seqEach(function (enfant) {
        const nextEnfant = this
        if (enfant.type === 'error' && /alias invalide/.test(enfant.titre) && enfant.parametres && enfant.parametres.original && enfant.parametres.original.aliasOf) {
          const badAlias = enfant.parametres.original.aliasOf
          // log.dataError(`trouvé bad alias ${badAlias} dans ${currentArbre}`) // debug
          if (badAlias.indexOf(myBaseId + '/') === 0) {
            const alias = badAlias.substr(myBaseId.length + 1)
            // log.dataError(`on cherche l’alias ${alias} dans ${currentArbre}`) // debug
            $ressourceRepository.load(alias, function (error, ressource) {
              if (error) return nextEnfant(error)
              if (ressource) {
                updateLog(`Erreur corrigée, enfant ${enfant.titre} remplacé par ${ressource.titre}`)
                aliasResolved = true
                hasChanged = true
                enfant = new Ref(ressource)
              } else {
                log.dataError(`Toujours pas trouvé l’alias ${alias} (en erreur avec ${badAlias} dans ${currentArbre})`)
              }
              if (enfant.enfants && enfant.enfants.length) {
                resolveAlias(enfant, false, function (error, newArbre, hasChanged2) {
                  if (error) return nextEnfant(error)
                  if (hasChanged2) {
                    aliasResolved = true
                    hasChanged = true
                    enfant = newArbre
                  }
                  nextEnfant(null, enfant)
                })
              } else {
                nextEnfant(null, enfant)
              }
            })
          } else {
            log.dataError(`mauvais alias ${badAlias} non résolu dans l’arbre ${currentArbre}`)
            nextEnfant()
          }
        } else {
          nextEnfant()
        }
      }).seq(function (enfants) {
        if (aliasResolved) {
          arbre.enfants = enfants
          hasChanged = true
        }
        next(null, arbre, hasChanged)
      }).catch(next)
    }

    // init
    const $ressourceRepository = lassi.service('$ressourceRepository')
    // les rid à passer à loadAndClean2
    const ridToClean = new Set()
    // des rid d'arbre contenant des aliasInvalides
    // une globale pour l'oid de l'arbre courant
    let currentArbre
    // une autre pour savoir s'il faut chercher des alias invalides
    let currentArbreHasInvalidAliases

    let nb = 0

    updateLog(name)
    flow().seq(function () {
      // $ressourceRepository.getListe('all', {filters: [{index: 'origine', values: ['sesamath']}]}, this)
      $ressourceRepository.loadByOrigin('sesamath', 'labomep_all', this)
    }).seq(function (labomepAll) {
      // on est pas forcément sur une sesatheque avec cet arbre
      if (labomepAll) {
        cleanArbre(labomepAll, this)
      } else {
        updateLog('pas d’arbre labomep_all sur cette sésathèque, rien à faire')
        done()
      }
    }).seq(function (todoThen) {
      purge(todoThen, this)
    }).seq(function () {
      updateLog(`traitement de ${nb} arbres terminé, on passe aux ressources qu’ils contenaient`)
      nb = 0
      this(null, [...ridToClean])
    }).seqEach(function (rid) {
      nb++
      if (nb % 100 === 0) updateLog(`traitement de la ${nb}e ressource`)
      loadAndClean2(rid, this)
    }).seq(function () {
      updateLog(`traitement de ${nb} ressources terminé`)
      done()
    }).catch(done)
  } // run
}
