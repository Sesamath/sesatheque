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

"use strict";

module.exports = function (Groupe, $cacheGroupe) {

  /**
   * @constructor
   */
  Groupe.construct = function() {
    /**
     * Id
     * @type {Number}
     */
    this.id = 0;
    /**
     * Nom
     * @type {string}
     */
    this.nom = '';
    /**
     * Visible dans la liste générale des groupes, tout le monde peut rentrer ou sortir à sa guise
     * @type {boolean}
     */
    this.open = false
  }

  Groupe.beforeStore(function(next) {
    log.debug('beforeStore groupe ' +this.nom)
    next()
  })

  Groupe.afterStore(function(next) {
    // on met en cache
    $cacheGroupe.set(this)
    // et on passe au suivant sans se préoccuper du retour de mise en cache
    next()
  })

  Groupe
    .defineIndex('id', 'integer')
    .defineIndex('nom', 'string')
    .defineIndex('open', 'boolean')
}
