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
'use strict'
var flow = require('an-flow')
var uuid = require('an-uuid')
var config = require('../../../../config')

/**
 * Update spécifique à commun, pour mettre en auteur le contributeur à virer dès qu'il sera passé pour jamais le relancer
 */
module.exports = function(job) {
  if (config.application.baseUrl.indexOf("commun") === -1) {
    job.init(0)
    job.done("")
  } else {
    var EntityRessource = lassi.service("EntityRessource")
    flow().seq(function () {
      EntityRessource.match('contributeurs').count(this)
    }).seq(function (nbRess) {
      var tours = job.init(nbRess, 50)
      flow(tours).seqEach(function (tour) {
        var nextTour = this
        log("On démarre à " + tour[0])
        flow().seq(function () {
          EntityRessource.match('contributeurs').grab(tour[1], tour[0], this)
        }).seq(function (ressources) {
          flow(ressources).seqEach(function (ressource) {
            ressource.auteurs = ressource.contributeurs
            ressource.contributeurs = []
            ressource.store(this)
            job.tick()
          }).seq(function () {
            nextTour()
          }).catch(job.done)
        }).catch(job.done)
      }).seq(function () {
        job.done("")
      }).catch(job.done)
    }).catch(job.done)
  }
}
