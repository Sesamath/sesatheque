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

const name = 'passe en public tous les arbres enfants de labomep_all et labomep_{profil}'
const description = ''

module.exports = {
  name: name,
  description: description,
  run: function run (done) {
    /**
     * Nettoie les enfants d'un arbre de leur aliasOf invalide d'après les infos de ridToClean
     * @param {Ressource} arbre
     */
    function cleanArbre (arbre, next) {
      // enregistre si besoin et passe au suivant
      function finish () {
        if (hasChanged && arbre.store) {
          updateLog(`enregistrement des modifications de ${arbre.oid} (${arbre.titre})`)
          arbre.store(next)
          $cacheRessource.delete(arbre.oid)
        } else {
          if (arbre.oid) updateLog(`pas de modifications pour ${arbre.oid} (${arbre.titre})`)
          next(null, arbre)
        }
      }

      if (arbre.oid === 50032) {
        updateLog(`On saute le traitement de ${arbre.titre} (${arbre.oid})`)
        return next(null, arbre)
      }
      if (verbose) applog(`traitement ${arbre.titre}`)
      let hasChanged = cleanItem(arbre)
      nb++
      // les enfants
      if (arbre.enfants && arbre.enfants.length) {
        flow(arbre.enfants).seqEach(function (enfant) {
          if (arbre.oid === 50032) verbose = true
          if (enfant.type === 'arbre') {
            cleanArbre(enfant, this)
          } else {
            hasChanged = cleanItem(enfant) || hasChanged
            this()
          }
        }).seq(function () {
          if (verbose) updateLog(`fin des enfants de ${arbre.oid || arbre.titre}`)
          finish()
        }).catch(next)

      // on est une ref à un autre arbre
      } else if (arbre.aliasOf) {
        // faut le charger pour le nettoyer
        const [baseId, oid] = getRidComponents(arbre.aliasOf)
        if (baseId !== myBaseId) {
          log.errorData(`arbre ${arbre.oid || arbre.titre} alias d’un item ailleurs ${arbre.aliasOf}`)
          return finish()
        }
        $ressourceRepository.load(oid, function (error, original) {
          if (verbose) updateLog('loading ' + oid)
          if (error) return next(error)
          if (original.aliasOf) log.errorData(`arbre ${arbre.oid || arbre.titre} alias d’un item ${arbre.aliasOf} lui-même alias ${original.aliasOf}`)
          if (original.type !== 'arbre') {
            log.errorData(`arbre ${arbre.oid || arbre.titre} alias d’un item ${arbre.aliasOf} qui n’est pas un arbre`)
            return finish()
          }
          cleanArbre(original, finish)
        })

      // un item arbre sans enfants ni aliasOf, pas très normal…
      } else {
        log.errorData(`arbre ${arbre.oid || arbre.titre} sans enfants ni aliasOf`)
        finish()
      }
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

    // init
    const $cacheRessource = lassi.service('$cacheRessource')
    const $ressourceRepository = lassi.service('$ressourceRepository')
    let nb = 0
    let verbose = false

    updateLog(name)
    flow().seq(function () {
      // $ressourceRepository.getListe('all', {filters: [{index: 'origine', values: ['sesamath']}]}, this)
      $ressourceRepository.loadByOrigin('sesamath', 'labomep_all', this)
    }).seq(function (all) {
      const nextStep = this
      if (all.restriction !== 0) {
        all.restriction = 0
        all.store(function (error, ress) {
          if (error) return nextStep(error)
          nextStep(null, ress.enfants)
        })
      } else {
        this(null, all.enfants)
      }
    }).seqEach(function (masterChild) {
      if (masterChild.type === 'arbre') {
        updateLog(`traitement de ${masterChild.titre} (${masterChild.aliasOf})`)
        cleanArbre(masterChild, this)
      } else {
        log.errorData(`un fils de labomep_all n’est pas un arbre`, masterChild)
        this()
      }
    }).seq(function () {
      updateLog(`traitement des ${nb} arbres terminé`)
      done()
    }).catch(done)
  } // run
}
