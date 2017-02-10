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
const applog = require('an-log')(lassi.settings.application.name)

var name = 'recherche et remplacement d’enfants référencés par origine/idOrigine'
var description = 'Cherche tous les enfants référencés par origine/idOrigine, essaie de trouver leur oid où l’origine correcte'

var limit = 100

function findChildByOrig (arbre, next) {
  var $ressourceRepository = lassi.service('$ressourceRepository')
  var modif = false
  // pour les logs
  var refArbre = arbre.oid || arbre.ref || arbre.titre.replace(' ', '_')
  flow(arbre.enfants).seqEach(function (enfant) {
    var nextEnfant = this
    if (enfant.ref) {
      var chunks = enfant.ref.split('/')
      if (chunks.length === 2) {
        flow().seq(function () {
          $ressourceRepository.load(enfant.ref, this)
        }).seq(function (ressource) {
          if (ressource) {
            enfant.ref = ressource.oid
            modif = true
            nextEnfant()
          } else {
            this()
          }
        }).seq(function () {
          // faut se creuser
          var origine = chunks[0]
          var idOrigine = chunks[1]
          var newRef
          if (origine === 'labomepBIBS' && idOrigine > 1000000 && idOrigine < 4000000) {
            // ils ont probablement été remplacé par la vraie ressource d'origine
            if (idOrigine < 2000000) {
              newRef = 'ato/' + (idOrigine - 1000000)
            } else if (idOrigine < 3000000) {
              newRef = 'coll_doc/' + (idOrigine - 2000000)
            } else {
              newRef = 'accomp/' + (idOrigine - 3000000)
            }
            $ressourceRepository.load(newRef, function (error, newEnfant) {
              if (newEnfant) {
                enfant = newEnfant
                modif = true
              } else {
                log.errorData('arbre ' + refArbre + ' avait un orphelin ' + enfant.ref + ', on a pas trouvé ' + newRef + ' non plus')
              }
              nextEnfant(error)
            })
          } else {
            // on sait pas où chercher
            log.errorData('arbre ' + refArbre + ' a un orphelin ' + enfant.ref)
            nextEnfant()
          }
        }).catch(log.error)
      } else {
        nextEnfant()
      }
    } else if (enfant.enfants) {
      findChildByOrig(enfant, function (isEnfantMod) {
        if (isEnfantMod) modif = true
        nextEnfant()
      })
    } else {
      log.errorData('arbre ' + refArbre + ' avec enfant sans ref ni enfants', enfant)
    }
  }).seq(function () {
    next(modif)
  }).catch(log.error)
}

module.exports = {
  name: name,
  description: description,
  run: function run (next) {
    var EntityRessource = lassi.service('EntityRessource')
    var query = EntityRessource.match('enfants').like('%/%')
    query.count(function (error, nb) {
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
            applog('update n°2', 'traitement des enfants de', offset, 'à', offset + limit - 1, 'sur', nb)
            query.grab(limit, offset, this)
          }).seq(function (arbres) {
            flow(arbres).seqEach(function (arbre) {
              var nextArbre = this
              findChildByOrig(arbre, function (isArbreMod) {
                if (isArbreMod) result.modifs.push(arbre.oid)
                nextArbre()
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
