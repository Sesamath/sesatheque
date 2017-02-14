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
const Ref = require('../../constructors/Ref')

const myBaseId = config.application.baseId
const updateNum = __filename.substring(__dirname.length + 1, __filename.length - 3)
const updatePrefix = 'update ' + updateNum

const name = 'conversion des ressources (ajout rid) et ref (dans les arbres)'
const description = ''

const limit = 100

/**
 * Nettoie les enfants de ref (si c'est un arbre avec enfants)
 * @param {Ressource|Ref} ref
 * @param {function}      next callback appelée avec (error, ref)
 */
function cleanEnfants (ref, next) {
  if (ref.enfants) {
    if (ref.enfants.length) {
      // y'a des enfants
      if (ref.type === 'arbre') {
        flow(ref.enfants).seqEach(function (enfant) {
          const nextEnfant = this
          const refEnfant = new Ref(enfant, myBaseId)
          if (refEnfant.baseId) delete refEnfant.baseId
          if (refEnfant.ref) delete refEnfant.ref
          if (refEnfant.enfants && refEnfant.enfants.length) {
            cleanEnfants(refEnfant, nextEnfant)
          } else {
            nextEnfant(null, refEnfant)
          }
        }).seq(function (enfants) {
          ref.enfants = enfants
          next(null, ref)
        }).catch(next)
      } else {
        log.error('enfants sur autre chose qu’un arbre', ref)
        next(new Error('Seul les arbres peuvent avoir des enfants'))
      }
    } else {
      // on vire des enfants vides sur autre chose qu'un arbre
      if (ref.type !== 'arbre') delete ref.enfants
      next(null, ref)
    }
  } else {
    // pas d'enfants à traiter
    next(null, ref)
  }
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    function grab () {
      let currentTotal
      flow().seq(function () {
        EntityRessource.match().sort('oid').grab(limit, offset, this)

      // on note le total
      }).seq(function (ressources) {
        currentTotal = ressources.length
        this(null, ressources)

      // on itère
      }).seqEach(function (ressource) {
        const nextRessource = this
        // en cas d'erreur, on veut la choper ici pour avoir les infos dans le log
        cleanEnfants(ressource, function (error, cleanRessource) {
          if (error) {
            log.error('pb dans la conversion des enfants de', ressource)
            log.error(error)
            nextRessource(null, ressource)
          } else {
            nextRessource(null, cleanRessource)
          }
        })

      // 2e itération pour sauver
      }).seqEach(function (ressource) {
        if (ressource.oid === 35580) log.error('la ressource 35580 avant store', ressource)
        // on passe pas par le repository pour éviter de tout mettre en cache, mais on vire du cache…
        $cacheRessource.delete(ressource.oid)
        ressource.store(this)

      // log + suivants ou fin
      }).seq(function () {
        applog(updatePrefix, 'appliqué de', offset, 'à', offset + currentTotal - 1, 'sur', nbRessources)
        if (currentTotal === limit) {
          offset += limit
          setTimeout(grab, 0)
        } else {
          next()
        }
      }).catch(next)
    }
    // init
    const EntityRessource = lassi.service('EntityRessource')
    const $cacheRessource = lassi.service('$cacheRessource')
    let offset = 0
    let nbRessources = 0

    // on compte et on y va
    EntityRessource.match().count(function (error, total) {
      if (error) return next(error)
      applog(updatePrefix, name, 'avec', total, 'ressources à traiter')
      if (total === 0) return next()
      nbRessources = total
      grab()
    })
  } // run
}
