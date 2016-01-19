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
 * Sésathèque est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER.
 * Consultez la GNU Affero General Public License pour plus de détails.
 * Vous devez avoir reçu une copie de la GNU General Public License en même temps que Sésathèque
 * (cf LICENCE.txt et http://vvlibri.org/fr/Analyse/gnu-affero-general-public-license-v3-analyse
 * pour une explication en français)
 */

/*global log*/
"use strict"
var flow = require('an-flow')
//var _ = require('lodash')

var Alias = require('../../../../ressource/constructors/Alias')
var configRessource = require('../../../../ressource/config')

module.exports = function(job) {
  /**
   * Formate les enfants d'un arbre au nouveau format (avec public et base)
   * @param {Arbre} arbre
   */
  function checkArbre(arbre) {
    if (arbre.enfants && arbre.enfants.length) {
      for (var i = 0; i < arbre.enfants.length; i++) {
        var enfant = arbre.enfants[i]
        var newEnfant = new Alias(enfant)
        newEnfant.public = enfant.public || (enfant.dataUri && enfant.dataUri.indexOf("public") > -1)
        if (!newEnfant.ref) {
          if (newEnfant.type === "arbre") {
            // on vire les null
            if (newEnfant.hasOwnProperty("ref")) delete newEnfant.ref
            delete newEnfant.public
          } else {
            // un enfant sans ref qui n'est pas un arbre
            log.errorData("Error : pas de ref dans l'arbre " + (arbre.oid || arbre.ref || arbre.titre) + " pour l'enfant ", enfant)
          }
        }
        if (enfant.type === "arbre" && enfant.enfants && enfant.enfants.length) {
          checkArbre(enfant)
          newEnfant.enfants = enfant.enfants
        }
        arbre.enfants[i] = newEnfant
      }
    }
    arbre.type = "arbre"
    arbre.categories = [configRessource.constantes.categories.liste]
  }

  var EntityRessource = lassi.service("EntityRessource")
  flow().seq(function () {
    EntityRessource.match('type').equals('arbre').sort("oid").count(this)
  }).seq(function (nbArbres) {
    log(nbArbres + " arbres trouvés dans " + __filename)
    var tours = job.init(nbArbres, 50)
    flow(tours).seqEach(function (tour) {
      var nextTour = this
      log("On démarre à " + tour[0])
      flow().seq(function () {
        EntityRessource.match('type').equals('arbre').sort("oid").grab(tour[1], tour[0], this)
      }).seq(function (arbres) {
        flow(arbres).seqEach(function (arbre) {
          var nextArbre = this
          //log("parsing arbre " +arbre.oid)
          checkArbre(arbre)
          arbre.store(function (error, arbreSaved) {
            if (error) {
              log.errorData("arbre invalide " + arbre.oid, error)
              log("arbre " + arbreSaved.oid + " KO")
              //} else {
              //log("arbre " +arbreSaved.oid +" ok")
            }
            job.tick()
            nextArbre()
          })
        }).seq(function () {
          nextTour()
        }).catch(job.done)
      }).catch(job.done)
    }).seq(function () {
      // log("dernier tour terminé")
      job.done("")
    }).catch(job.done)
  }).catch(job.done)
}
