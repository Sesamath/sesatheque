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

var flow = require('an-flow')
var applog = require('an-log')(lassi.settings.application.name)

var name = 'ajout résumés aux arbres'
var description = 'ajoute les résumés et commentaires dans tous les arbres'

var limit = 100

function enhanceChildren (arbre, next) {
  var $ressourceRepository = lassi.service('$ressourceRepository')
  var modif = false
  flow(arbre.enfants).seqEach(function (enfant) {
    var nextEnfant = this
    var ref = enfant.ref || enfant.oid
    if (enfant.enfants) {
      enhanceChildren(enfant, function (error, modifEnfant) {
        if (!error && !modif && modifEnfant) modif = true
        nextEnfant(error)
      })
      // s'il a des enfants il devrait pas avoir de ref, on vérifie !
      if (ref) log.errorData('L’enfant ' + ref + ' de l’arbre ' + (arbre.oid || arbre.ref) + ' a des enfants et une ref')
    } else if (ref) {
      $ressourceRepository.load(ref, function (error, ressource) {
        if (!error && ressource) {
          if (ressource.resume !== enfant.resume) {
            enfant.resume = ressource.resume
            if (!modif) modif = true
          }
          if (ressource.description !== enfant.description) {
            enfant.description = ressource.description
            if (!modif) modif = true
          }
        } else if (!error) {
          log.errorData('Impossible de trouver l’enfant ' + ref + ' de l’arbre ' + arbre.oid)
        }
        nextEnfant(error)
      })
    } else {
      log.errorData('arbre avec un enfant sans ref ni enfants', arbre)
      nextEnfant()
    }
  }).seq(function () {
    next(modif)
  }).catch(function (error) {
    log.errorData('erreur ' + error.toString() + ' avec un enfant de l’arbre', arbre)
    next(false)
  })
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    var EntityRessource = lassi.service('EntityRessource')
    EntityRessource.match('type').equals('arbre').count(function (error, nb) {
      if (error) {
        next(error)
      } else {
        var offsets = []
        for (var i = 0; i <= Math.floor(nb / limit); i++) {
          offsets.push(i * limit)
        }
        var result = {success: true, modifs: []}
        flow(offsets).seqEach(function (offset) {
          var nextPaquet = this
          flow().seq(function () {
            applog('update n°1', 'traitement des arbres de', offset, 'à', offset + limit - 1, 'sur', nb)
            EntityRessource.match('type').equals('arbre').grab(limit, offset, this)
          }).seq(function (arbres) {
            flow(arbres).seqEach(function (arbre) {
              var nextArbre = this
              enhanceChildren(arbre, function (modif) {
                if (modif) {
                  arbre.store(function (error, arbre) {
                    if (!error && arbre) result.modifs.push(arbre.oid)
                    nextArbre(error)
                  })
                } else {
                  nextArbre()
                }
              })
            }).seq(function () {
              nextPaquet()
            }).catch(next)
          }).catch(next)
        }).seq(function () {
          next(null, result)
        }).catch(next)
      }
    }) // count
  } // run
}
