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

'use strict'

module.exports = function (EntityPersonne, EntityGroupe, $personneRepository) {
  var seq = require('seq')
  var _ = require('lodash')
  var tools = require('../tools')

  /**
   * Service de gestion des droits (donc demande le contexte en argument, parfois la ressource concernée)
   * à la jonction entre personne et ressource.
   * @service $personneControl
   */
  var $personneControl = {}

  /**
   * Normalise la propriété groupes d'une ressource (en vérifiant qu'ils existent)
   *
   * @param {Ressource}     ressource
   * @param {errorCallback} next
   * @memberOf $personneControl
   */
  $personneControl.checkGroupes = function (ressource, next) {
    var groupes = (_.isArray(ressource.groupes)) ? ressource.groupes : [],
        tmpGroupes
    if (typeof ressource.groupes === "string") {
      ressource.groupes = []
      tmpGroupes = ressource.groupes.split(",")
      tmpGroupes.forEach(function (groupe) {
        groupes.push(groupe.trim())
      })
    }

    // on ajoute new si besoin
    if (ressource.groupesNew) {
      tmpGroupes = ressource.groupesNew.split(",")
      tmpGroupes.forEach(function (groupe) {
        groupes.push(groupe.trim())
      })
    }

    // et on vérifie qu'ils existent
    ressource.groupes = []
    seq(groupes).seqEach(function (groupeNom) {
      var nextGroupe = this
      $personneRepository.loadGroupeByNom(groupeNom, function (error, groupe) {
        if (error) ressource.errors.push(error.toString())
        else if (groupe) ressource.groupes.push(groupeNom)
      })
      //
    })
  }

  /**
   * Normalise les propriétés auteurs et contributeurs (en vérifiant qu'ils existent)
   * @param {Ressource}     ressource
   * @param {errorCallback} next
   * @memberOf $personneControl
   */
  $personneControl.checkGroupes = function (ressource, next) {

  }

  return $personneControl
}
